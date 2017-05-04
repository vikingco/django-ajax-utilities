# {% xhr %} template tag.
# Skip rendering, but replace output with placeholder which will load the content
# through AJAX later on.

# {% xhr %}
#    ...
# {% else %}
#    ...
# {% endxhr %}
from django.template import Library, Node, loader
from django.conf import settings

register = Library()


class XhrNode(Node):
    def __init__(self, xhr_nodelist, else_nodelist):
        self.xhr_nodelist = xhr_nodelist
        self.else_nodelist = else_nodelist

    def render(self, context):
        container = '<div class="xhr_container">%s</div>'

        # When this is a XHR request, render the real content
        if 'request' in context and ('xhr' in context['request'].GET or 'xhr' in context['request'].POST):
            return container % self.xhr_nodelist.render(context)
        # Otherwise, render a loading placeholder
        else:
            if self.else_nodelist:
                return container % self.else_nodelist.render(context)
            else:
                template = getattr(settings, 'XHR_LOADING_TEMPLATE', 'django-ajax/_loader.html')
                return container % loader.get_template(template).render()


@register.tag
def xhr(parser, token):
    # Nodelist
    xhr_nodelist = parser.parse(('endxhr', 'else'))
    else_nodelist = None

    if parser.tokens[0].contents == 'else':
        parser.delete_first_token()

        else_nodelist = parser.parse(('endxhr',))
        parser.delete_first_token()
    else:
        parser.delete_first_token()

    # Return meta node
    return XhrNode(xhr_nodelist, else_nodelist)
