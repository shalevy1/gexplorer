from setuptools import setup, find_packages

setup(
    name="explorer",
    version="1.0.0",
    description="Graph Data Explorer",
    packages=find_packages(exclude=('tests', 'docs')),
    zip_safe=False,
    license="Apache License 2.0",
    include_package_data=True,
    install_requires=[
        "flask",
        "python-dotenv",
        "psqlgraph",
        "gdcdictionary",
        "biodictionary",
        "gdcdatamodel"
    ],
    package_data={"explorer": ["static/*.html", "static/*/*.js", "static/*/*.css"]}
)
