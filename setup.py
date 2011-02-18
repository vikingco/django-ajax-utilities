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
                'templates/*.html', 'static/*/*.html', 'static/*/*/*.html'
                ],},
    include_package_data=True,
    package_dir = {'': 'src'},
    classifiers = [
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: BSD License',
        'Programming Language :: Python',
        'Operating System :: OS Independent',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Topic :: Software Development :: Internationalization',
    ],
)

