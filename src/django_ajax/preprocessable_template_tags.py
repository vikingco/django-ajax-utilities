

# Preprocess following tags in the template preprocessor.
# https://github.com/citylive/django-template-preprocessor


from template_preprocessor import preprocess_tag
from django.conf import settings
from django.utils.translation import ugettext as _



@preprocess_tag
def tabpage(*args):
    return u'<div class="tabbing">'

@preprocess_tag
def tabs(*args):
    return u'<div class="tabbing-tabs">'

@preprocess_tag
def endtabs(*args):
    return u'</div>'

@preprocess_tag
def tabcontent(*args):
    if hasattr(settings, 'STATIC_URL'):
        loader = '<img src="%sajax-utilities/img/loader.gif" alt="%s" />' % (settings.STATIC_URL, _('Loading'))
    else:
        loader = '<img src="%scommon/img/loader.gif" alt="%s" />' % (settings.MEDIA_URL, _('Loading'))

    return (u'<div class="tabbing-loader" style="display:none;">%s %s</div>'
                u'<div class="tabbing-content">') % (loader, _('Loading data...'))

@preprocess_tag
def endtabcontent(*args):
    return u'</div>'

@preprocess_tag
def endtabpage(*args):
    return u'</div>'
