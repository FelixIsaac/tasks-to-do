from cryptography.fernet import Fernet
from uuid import uuid4
import bcrypt
from mongoengine import ValidationError, NotRegistered, DoesNotExist
from ..db.models.user import User

# encryption key
print(Fernet.generate_key())
with open("config.json") as config:
    encryption = Fernet(dict(config)[dict(config)["env"]]["encryption_key"])


def signup(email, username, password):
    if not email or not username or not password:
        return

    try:
        email = encryption.encrypt(email.encode())
        print(email)

        User(
            email=email,
            username=username,
            password=bcrypt.hashpw(f"{email}:{username}:{password}-{uuid4()}", bcrypt.gensalt(12))
        )
    except TypeError:
        return {
            "error": True,
            "status": 400,
            "message": "Invalid username or password"
        }
    except SystemError as e:
        print(e)

        return {
            "error": True,
            "status": 500,
            "message": "Something went wrong on our end!"
        }
    except TimeoutError as e:
        print(e)

        return {
            "error": True,
            "status": 500,
            "message": "Something went wrong on our end!"
        }


def login(username, password):
    if not username or not password:
        return

    try:
        user = dict(User.objects.get(username=username, password=password).to_mongo())

        if user:
            return {
                "error": False,
                "status": 200,
                "message": "Logged in"
            }
    except ValidationError as e:
        print(e)

        return {
            "error": True,
            "status": 400,
            "message": "Invalid username or password"
        }
    except NotRegistered as e:
        print(e)

        return {
            "error": True,
            "status": 400,
            "message": "Invalid username or password"
        }
    except DoesNotExist as e:
        return {
            "error": True,
            "status": 400,
            "message": "Invalid username or password"
        }
    except TypeError:
        return {
            "error": True,
            "status": 400,
            "message": "Invalid username or password"
        }
    except SystemError as e:
        print(e)

        return {
            "error": True,
            "status": 500,
            "message": "Something went wrong on our end!"
        }
    except TimeoutError as e:
        print(e)

        return {
            "error": True,
            "status": 500,
            "message": "Something went wrong on our end!"
        }
    except EnvironmentError as e:
        print(e)

        return {
            "error": True,
            "status": 500,
            "message": "Something went wrong on our end!"
        }
