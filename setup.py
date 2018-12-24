from setuptools import setup, find_packages

setup(
    name="explorer",
    version="1.0.0",
    description="Graph Data Explorer",
    packages=find_packages(exclude=('tests', 'docs')),
    install_requires=[
        "cherrypy==17.4.1",
    ]
)