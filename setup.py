from setuptools import setup, find_packages

setup(
    name='django-ajax-utilities',
    version='1.2.8',
    url='https://github.com/vikingco/django-ajax-utilities',
    license='BSD',
    description='Pagination, xhr and tabbing utilities for the Django framework.',
    long_description=open('README', 'r').read(),
    author='Unleashed NV',
    author_email='operations@unleashed.be',
    packages=find_packages('.'),
    package_data={'django_ajax': [
                'static/*.js', 'static/*/*.js', 'static/*/*/*.js',
                'static/*.css', 'static/*/*.css', 'static/*/*/*.css',
                'static/*.png', 'static/*/*.png', 'static/*/*/*.png', 'static/*/*/*/*.png',
                'static/*.gif', 'static/*/*.gif', 'static/*/*/*.gif', 'static/*/*/*/*.gif',
                'templates/*.html', 'templates/*/*.html', 'templates/*/*/*.html'
                ]},
    zip_safe=False,
    include_package_data=True,
    classifiers=[
        'Intended Audience :: Developers',
        'Programming Language :: Python',
        'Operating System :: OS Independent',
        'Environment :: Web Environment',
        'Framework :: Django',
    ],
)
