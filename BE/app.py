from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import inspect, text

from config import Config
from extensions import db, jwt
from auth import auth_bp
from decorators import roles_required
from models import User, Role


def ensure_database_schema():
    """Add missing columns for older database instances created before role/status fields existed."""
    inspector = inspect(db.engine)
    tables = set(inspector.get_table_names())

    if "users" in tables:
        user_columns = {col["name"] for col in inspector.get_columns("users")}
        if "role" not in user_columns:
            db.session.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'STUDENT'"))
        if "status" not in user_columns:
            db.session.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'"))
        if "created_at" not in user_columns:
            db.session.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))

    if "password_reset_tokens" in tables:
        token_columns = {col["name"] for col in inspector.get_columns("password_reset_tokens")}
        if "used_at" not in token_columns:
            db.session.execute(text("ALTER TABLE password_reset_tokens ADD COLUMN used_at TIMESTAMP NULL"))

    db.session.commit()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(auth_bp)

    with app.app_context():
        db.create_all()
        ensure_database_schema()

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

