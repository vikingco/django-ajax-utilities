from setuptools import setup, find_packages

setup(
    name = "django-ajax-utilities",
    version = "0.1",
    url = 'https://github.com/citylive/django-ajax-utilities',
    license = 'BSD',
    description = "Pagination, xhr and tabbing utilities for the Django framework.",
    long_description = open('README','r').read(),
    author = 'Jonathan Slenders, City Live nv',
    packages = find_packages('src'),
    package_data = {'ajax_utilities': [
                'static/*.js', 'static/*/*.js', 'static/*/*/*.js',
                'templates/*.html', 'templates/*/*.html', 'templates/*/*/*.html'
                ],},
    zip_safe=False, # Don't create egg files, Django cannot find templates in egg files.
    include_package_data=True,
    package_dir = {'': 'src'},
    classifiers = [
        'Intended Audience :: Developers',
        'Programming Language :: Python',
        'Operating System :: OS Independent',
        'Environment :: Web Environment',
        'Framework :: Django',
    ],
)

