import os


class Env(object):
    """
    A simple dotenv implementation. Looks for a file named .env
    with lines in key=value or key: value pairs
    Example:
        HOST = http://google.com
    If file exists, values set will be used to replace those set in the environment variable.
    The order of operation is to check values set in this file first if it does not exist check environment variable
    """

    def __init__(self, env_file_name=None):

        self.env = {}
        self.env_file_name = env_file_name or ".env"
        self._load()

    def _load(self):
        env_file = os.path.join(os.path.dirname(".."), self.env_file_name)
        if os.path.exists(env_file) and os.path.isfile(env_file):
            with open(env_file, 'r') as envs:
                for ienv in envs:
                    if "=" in ienv:
                        kv = ienv.split("=")
                    else:
                        kv = ienv.split(":")

                    if len(kv) == 2:
                        self.env[kv[0].strip()] = kv[1].strip()

    def get(self, key, default_val=None, reload=False):
        """
        Gets a value by first checking if it is set in the .env file
        Args:
            key (str): variable key, could be any string
            default_val (object): default value to return if none is found in the environment
            reload (bool): if True force re-reading of env vars from plarform
        Returns:
            the value as specified in the environment variable or the default value if not in the
                environment
        """

        if reload:
            self._load()

        if key in self.env:
            return self.env[key]
        else:
            return os.environ.get(key, default_val)


# init env
env = Env()
