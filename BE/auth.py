import hashlib
import os
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from flask import current_app
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db
from models import User, Role, PasswordResetToken

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    full_name = " ".join((data.get("fullName") or "").split())
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or Role.STUDENT).strip().upper()

    if not full_name or not email or not password:
        return jsonify({"message": "Vui l?ng nh?p ??y ?? h? t?n, email v? m?t kh?u."}), 400
    if len(password) < 8:
        return jsonify({"message": "M?t kh?u c?n c? ?t nh?t 8 k? t?."}), 400
    if role not in (Role.STUDENT, Role.LECTURER):
        return jsonify({"message": "Vai tr? t?i kho?n kh?ng h?p l?."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email n?y ?? ???c s? d?ng."}), 409

    user = User(
        full_name=full_name,
        email=email,
        password_hash=generate_password_hash(password),
        role=role,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "??ng k? th?nh c?ng!", "user": user.to_dict()}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Email hoặc mật khẩu không chính xác!"}), 401

    if user.status != "ACTIVE":
        return jsonify({"message": "Tài khoản của bạn đã bị khóa!"}), 403

    # additional_claims chứa role để phân quyền ở decorators.roles_required
    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})

    return jsonify({
        "message": "Đăng nhập thành công!",
        "token": token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Frontend gọi endpoint này mỗi khi tải lại trang.

    Nếu token còn lưu trong localStorage và còn hạn (30 ngày), request này
    trả về 200 kèm thông tin user -> frontend tự động coi là đã đăng nhập,
    KHÔNG bắt nhập lại email/mật khẩu. Nếu token hết hạn/không hợp lệ,
    flask-jwt-extended tự trả về 401 và frontend điều hướng về trang login.
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"message": "Không tìm thấy người dùng!"}), 404
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    # JWT ở đây là stateless (không lưu session phía server), nên logout
    # chỉ cần frontend xóa token đã lưu (localStorage) là đủ.
    return jsonify({"message": "Đăng xuất thành công!"}), 200



def _password_reset_digest(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _send_reset_email(user, reset_url):
    host = os.environ.get("MAIL_SERVER")
    if not host:
        current_app.logger.warning("Password reset link for %s: %s", user.email, reset_url)
        return
    message = EmailMessage()
    message["Subject"] = "Dat lai mat khau ClassBridge"
    message["From"] = os.environ.get("MAIL_DEFAULT_SENDER", os.environ.get("MAIL_USERNAME", ""))
    message["To"] = user.email
    message.set_content(f"Xin chao {user.full_name},\n\nDung lien ket sau de dat lai mat khau (co hieu luc trong 30 phut):\n{reset_url}\n\nNeu ban khong yeu cau, hay bo qua email nay.")
    port = int(os.environ.get("MAIL_PORT", "587"))
    with smtplib.SMTP(host, port, timeout=15) as smtp:
        if os.environ.get("MAIL_USE_TLS", "true").lower() == "true":
            smtp.starttls()
        username, password = os.environ.get("MAIL_USERNAME"), os.environ.get("MAIL_PASSWORD")
        if username and password:
            smtp.login(username, password)
        smtp.send_message(message)


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    if not email:
        return jsonify({"message": "Vui long nhap email hop le."}), 400
    user = User.query.filter_by(email=email).first()
    if user:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        token = secrets.token_urlsafe(32)
        PasswordResetToken.query.filter_by(user_id=user.id, used_at=None).update({"used_at": now})
        db.session.add(PasswordResetToken(user_id=user.id, token_hash=_password_reset_digest(token), expires_at=now + timedelta(minutes=30)))
        db.session.commit()
        base_url = os.environ.get("PASSWORD_RESET_URL", "http://localhost:3000/reset-password")
        try:
            _send_reset_email(user, f"{base_url}?token={token}")
        except (OSError, smtplib.SMTPException):
            current_app.logger.exception("Could not send password reset email")
            return jsonify({"message": "Khong the gui email luc nay. Vui long thu lai sau."}), 503
    return jsonify({"message": "Neu email thuoc mot tai khoan, huong dan dat lai mat khau se duoc gui."}), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    token, password = data.get("token") or "", data.get("password") or ""
    if len(password) < 8:
        return jsonify({"message": "Mat khau can co it nhat 8 ky tu."}), 400
    reset_token = PasswordResetToken.query.filter_by(token_hash=_password_reset_digest(token)).first()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if not reset_token or reset_token.used_at or reset_token.expires_at <= now:
        return jsonify({"message": "Lien ket dat lai mat khau khong hop le hoac da het han."}), 400
    user = db.session.get(User, reset_token.user_id)
    if not user:
        return jsonify({"message": "Lien ket dat lai mat khau khong hop le hoac da het han."}), 400
    user.password_hash = generate_password_hash(password)
    PasswordResetToken.query.filter(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None)).update({"used_at": now})
    db.session.commit()
    return jsonify({"message": "Dat lai mat khau thanh cong. Vui long dang nhap bang mat khau moi."}), 200
