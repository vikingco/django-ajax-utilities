# {% tabbing %} template tag.
# Tab page generation

# {% tabpage %}   | {% tabpage no_ajax %}
#   {% tabs %}
#         <ul>
#           <li><a href="..."></a></li>
#           <li><a href="..."></a></li>
#         </ul>
#
#        {% tab "name" %}<a href="..."> ...</a>{% endtab %} <--  does not yet work
#   {% endtabs %}
#   {% tabcontent %}
#         ...
#   {% endtabcontent %}
# {% endtabpage %}
from django.template import Library, Node, loader
from django.conf import settings

register = Library()


class TabPageNode(Node):
    def __init__(self, tabs_nodelist, tabcontent_nodelist, no_ajax):
        self.tabs_nodelist = tabs_nodelist
        self.tabcontent_nodelist = tabcontent_nodelist
        self.no_ajax = no_ajax

    def render(self, context):
        # Render child nodelists
        tabs = (self.tabs_nodelist.render(context) if self.tabs_nodelist else '')
        content = (self.tabcontent_nodelist.render(context) if self.tabcontent_nodelist else '')

        return loader.get_template('tabbing/default-style.html').render(
                    {
                            'tabs': tabs,
                            'content': content,
                            'MEDIA_URL': getattr(settings, 'MEDIA_URL', ''),
                            'STATIC_URL': getattr(settings, 'STATIC_URL', ''),
                            'no_ajax': self.no_ajax,
                            })

    def __iter__(self):
        for node in self.tabs_nodelist:
            yield node
        for node in self.tabcontent_nodelist:
            yield node

    def get_nodes_by_type(self, nodetype):
        nodes = []
        if isinstance(self, nodetype):
            nodes.append(self)
        nodes.extend(self.tabs_nodelist.get_nodes_by_type(nodetype))
        nodes.extend(self.tabcontent_nodelist.get_nodes_by_type(nodetype))
        return nodes


@register.tag
def tabpage(parser, token):
    # Nodelist
    tabs_nodelist = None
    tabcontent_nodelist = None

    bits = token.contents.split()
    no_ajax = 'no_ajax' in bits

    while True:
        parser.delete_first_token()
        parser.parse(('tabs', 'tabcontent', 'endtabpage', ))

        t = parser.tokens[0].contents

        if t == 'tabs':
            parser.delete_first_token()
            tabs_nodelist = parser.parse(('endtabs',))
        elif t == 'tabcontent':
            parser.delete_first_token()
            tabcontent_nodelist = parser.parse(('endtabcontent',))
        elif t == 'endtabpage':
            parser.delete_first_token()
            return TabPageNode(tabs_nodelist, tabcontent_nodelist, no_ajax)
        else:
            raise Exception('Found unexpected token {}'.format(t))
