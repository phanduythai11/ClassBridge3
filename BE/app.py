from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db, jwt
from auth import auth_bp
from decorators import roles_required
from models import User, Role


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(auth_bp)

    with app.app_context():
        db.create_all()

    @app.route("/")
    def home():
        return "Server Flask đang chạy và kết nối PostgreSQL thành công!"

    # Route mẫu minh họa phân quyền: chỉ ADMIN mới xem được danh sách user.
    @app.route("/api/admin/users", methods=["GET"])
    @roles_required(Role.ADMIN)
    def list_users():
        users = User.query.order_by(User.created_at.desc()).all()
        return jsonify([u.to_dict() for u in users]), 200

    # Route mẫu cho GIẢNG VIÊN.
    @app.route("/api/lecturer/ping", methods=["GET"])
    @roles_required(Role.LECTURER, Role.ADMIN)
    def lecturer_ping():
        return jsonify({"message": "Xin chào giảng viên!"}), 200

    return app


app = create_app()

if __name__ == "__main__":
    app.run(port=5000, debug=True)

