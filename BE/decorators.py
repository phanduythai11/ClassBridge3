from functools import wraps

from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt


def roles_required(*roles):
    """Decorator: chỉ cho phép các role được liệt kê truy cập route.

    Ví dụ:
        @app.route("/api/admin/users")
        @roles_required(Role.ADMIN)
        def list_users(): ...
    """

    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") not in roles:
                return jsonify({"message": "Bạn không có quyền truy cập chức năng này!"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator

