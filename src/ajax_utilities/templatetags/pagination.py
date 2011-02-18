# Author: Jonathan Slenders, City Live

import math

from django import template
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.http import urlencode
from django.utils.translation import ugettext as _

register = template.Library()


@register.tag('paginate')
def paginator(parser, token):
    """
    {% paginate paginator_object style="glossyp" nopreload %} content nodes {% endpaginate %}
    """
    args = token.split_contents()

    # Parameters
    page = args[1]

    style=None
    preload=True
    for a in args[1:]:
        if a[0:len('style=')] == 'style=':
            style = a[len('style='):]
        if a == 'nopreload':
            preload = False

    # Read nodelist
    nodelist = parser.parse(('endpaginate',))
    parser.delete_first_token()

    # Return meta node
    return PaginateNode(page, nodelist, style, preload)


class PaginateNode(template.Node):
    def __init__(self, page, nodelist, style=None, preload=True):
        self.page = template.Variable(page)
        self.nodelist = nodelist
        self.style = style
        self.preload = preload

    def render(self, context):
        page = self.page.resolve(context)

        if not page:
            return u''

        context = {
                'request': context['request'],
                'preload': self.preload,
                'current': page.number,
                'total': page.paginator.num_pages,
                'body': self.nodelist.render(context),
                'prev_page': page.previous_page_number() if page.has_previous() else None,
                'next_page': page.next_page_number() if page.has_next() else None,
                'query_string': lambda page_number: self._querystring(page, page_number),
                'MEDIA_URL': settings.MEDIA_URL,
            }

        # If a style was defined in the template tag, use that style
        if self.style:
            style = template.Variable(self.style).resolve(context)
        # Otherwise, use the style defined in the settings.
        else:
            style = getattr(settings, 'PAGINATOR_STYLE', 'glossyp')

        # Render
        if style == 'digg':
            # Render paginator in digg style
            context.update(self._digg_style_context(
                        page.number,
                        page.paginator.num_pages))

            return render_to_string('pagination/digg-style.html', context)

        elif style == 'glossyp':
            # Render paginator in glossyp style
            return render_to_string('pagination/glossyp-style.html', context)

        else:
            raise Exception('Unknown pagination style: %s' % style)


    def _querystring(self, page, page_number):
        # Query dict of parameters
        try:
            querydict = page.additional_parameters
            querydict[page.page_variable] = page_number
            querydict = urlencode(querydict)
        except AttributeError:
            querydict = 'page=%s' % page_number

        query_string = '?' + querydict

        # Use get parameters?
        if page.use_get_parameters:
            for k,v in page.request.GET.iterlists():
                if k != page.page_variable:
                    for v2 in v:
                        query_string = '%s&%s' % (query_string, urlencode({k:v2}))

        return query_string


    def _digg_style_context(self, number, num_pages):
        """
        Additional context to be passed to the pagination template:

        Some code has been borrowed from DiggPaginator
        http://djangosnippets.org/snippets/773/
        """

        padding = 0
        margin = 0
        tail = 1
        body = 5

        # put active page in middle of main range
        main_range = map(int, [
            math.floor(number-body/2.0)+1,  # +1 = shift odd body to right
            math.floor(number+body/2.0)])
        # adjust bounds
        if main_range[0] < 1:
            main_range = map(abs(main_range[0]-1).__add__, main_range)
        if main_range[1] > num_pages:
            main_range = map((num_pages-main_range[1]).__add__, main_range)

        # Determine leading and trailing ranges; if possible and appropriate,
        # combine them with the main range, in which case the resulting main
        # block might end up considerable larger than requested. While we
        # can't guarantee the exact size in those cases, we can at least try
        # to come as close as possible: we can reduce the other boundary to
        # max padding, instead of using half the body size, which would
        # otherwise be the case. If the padding is large enough, this will
        # of course have no effect.
        # Example:
        #     total pages=100, page=4, body=5, (default padding=2)
        #     1 2 3 [4] 5 6 ... 99 100
        #     total pages=100, page=4, body=5, padding=1
        #     1 2 3 [4] 5 ... 99 100
        # If it were not for this adjustment, both cases would result in the
        # first output, regardless of the padding value.


        if main_range[0] <= tail+margin:
            leading = []
            main_range = [1, max(body, min(number+padding, main_range[1]))]
            main_range[0] = 1
        else:
            leading = range(1, tail+1)
        # basically same for trailing range, but not in ``left_align`` mode
        if False and self.align_left:
            trailing = []
        else:
            if main_range[1] >= num_pages-(tail+margin)+1:
                trailing = []
                if not leading:
                    # ... but handle the special case of neither leading nor
                    # trailing ranges; otherwise, we would now modify the
                    # main range low bound, which we just set in the previous
                    # section, again.
                    main_range = [1, num_pages]
                else:
                    main_range = [min(num_pages-body+1, max(number-padding, main_range[0])), num_pages]
            else:
                trailing = range(num_pages-tail+1, num_pages+1)

        # finally, normalize values that are out of bound; this basically
        # fixes all the things the above code screwed up in the simple case
        # of few enough pages where one range would suffice.
        main_range = [max(main_range[0], 1), min(main_range[1], num_pages)]

        # make the result of our calculations available as custom ranges
        # on the ``Page`` instance.
        main_range = range(main_range[0], main_range[1]+1)

        return {
            'main_range': main_range,
            'leading_range': leading,
            'trailing_range': trailing,
            'page_range': reduce(lambda x, y: x+((x and y) and [False])+y,
                [leading, main_range, trailing]),
            }
