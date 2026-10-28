import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")

    # PostgreSQL connection string.
    # Format: postgresql+psycopg2://<user>:<password>@<host>:<port>/<database>
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:1234@localhost:5432/classbridge",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-me-jwt-secret")
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # Yêu cầu "đăng nhập 1 lần": access token sống lâu (30 ngày) thay vì
    # hết hạn sau vài phút/giờ như mặc định, để người dùng không phải
    # đăng nhập lại mỗi khi mở lại trang.
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)

