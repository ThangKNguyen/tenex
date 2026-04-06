# Import models so Flask-Migrate can discover them when generating migrations.
# If a model isn't imported before `flask db migrate` runs, it won't get a migration.
from .user import User
from .upload import Upload
