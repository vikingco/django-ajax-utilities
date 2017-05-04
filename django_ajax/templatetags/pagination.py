from math import floor

from django import template
from django.conf import settings
from django.template.loader import render_to_string

register = template.Library()


@register.tag('paginate')
def paginator(parser, token):
    """
    {% paginate paginator_object nopreload %} content nodes {% endpaginate %}
    """
    args = token.split_contents()

    # Parameters
    page = args[1]

    preload = True
    for a in args[1:]:
        if a == 'nopreload':
            preload = False

    # Read nodelist
    nodelist = parser.parse(('endpaginate',))
    parser.delete_first_token()

    # Return meta node
    return PaginateNode(page, nodelist, preload)


@register.simple_tag
def paginated_querystring(page, page_number):
    """
    Returns the http query part of the url with a given page number
    :param page_number:
    """
    return '?{}={}'.format(page, page_number)


class PaginateNode(template.Node):
    def __init__(self, page, nodelist, preload=True):
        self.page = template.Variable(page)
        self.nodelist = nodelist
        self.preload = preload

    def render(self, context):
        page = self.page.resolve(context)

        if not page:
            return u''

        context = {
                'request': page.request,
                'preload': self.preload,
                'current': page.number,
                'total': page.paginator.num_pages,
                'body': self.nodelist.render(context),
                'page': self.page,
                'page_variable': page.paginator.page_variable,
                'prev_page': page.previous_page_number() if page.has_previous() else None,
                'next_page': page.next_page_number() if page.has_next() else None,
                'MEDIA_URL': getattr(settings, 'MEDIA_URL', ''),
                'STATIC_URL': getattr(settings, 'STATIC_URL', ''),
            }

        style = getattr(settings, 'PAGINATION_STYLE', None)
        if style and style == 'verbose':
            context.update(self._verbose_context(page.number, page.paginator.num_pages))
            return render_to_string('pagination/paginate-verbose.html', context)
        else:
            return render_to_string('pagination/paginate.html', context)

    def _verbose_context(self, number, num_pages):
        main_range = map(int, [floor(number-5 / 2.0) + 1, floor(number + 5 / 2.0)])

        if main_range[0] < 1:
            main_range = map(abs(main_range[0] - 1).__add__, main_range)
        if main_range[1] > num_pages:
            main_range = map((num_pages - main_range[1]).__add__, main_range)

        if main_range[0] <= 1:
            leading = []
            main_range = [1, max(5, min(number, main_range[1]))]
            main_range[0] = 1
        else:
            leading = range(1, 2)

        if main_range[1] >= num_pages:
            trailing = []
            if not leading:
                main_range = [1, num_pages]
            else:
                main_range = [min(num_pages - 4, max(number, main_range[0])), num_pages]
        else:
            trailing = range(num_pages, num_pages+1)

        main_range = [max(main_range[0], 1), min(main_range[1], num_pages)]

        main_range = range(main_range[0], main_range[1] + 1)

        return {'main_range': main_range, 'leading_range': leading, 'trailing_range': trailing,
                'page_range': reduce(lambda x, y: x+((x and y) and [False]) + y, [leading, main_range, trailing])}
