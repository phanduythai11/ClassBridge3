import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")

    # M?c d?nh dùng SQLite trong môi tru?ng dev local d? không c?n PostgreSQL.
    # N?u có DATABASE_URL thì uu tiên dùng giá tr? dó.
    sqlite_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "instance", "adaptive_lms.db"))
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{sqlite_db_path}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-me-jwt-secret")
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # Yêu c?u "dang nh?p 1 l?n": access token s?ng lâu (30 ngày) thay vì
    # h?t h?n sau vài phút/gi? nhu m?c d?nh, d? ngu?i dùng không ph?i
    # dang nh?p l?i m?i khi m? l?i trang.
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)