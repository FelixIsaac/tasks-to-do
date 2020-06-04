import mongoengine as me
from .list import List


class User(me.Document):
    username = me.StringField(required=True)
    email = me.StringField(required=True, unique=True)
    authentication = {
        "password": me.StringField(required=True),
        "oauth": {
            "google": me.StringField(),
            "2fa": me.StringField(),
            "keys": me.ListField()
        }
    }
    list = me.ListField(me.ReferenceField(List))
