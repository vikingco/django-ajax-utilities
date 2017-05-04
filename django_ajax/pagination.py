"""
The Paginator and Page classes have been copied from django/core/paginator.py
But little changes were applied to fit our needs.

The paginate method and template tags are own design.
"""
from math import ceil


class Paginator(object):
    def __init__(self, object_list, per_page, page_variable, allow_empty_first_page=True, object_count=None):
        self.object_list = object_list
        self.per_page = per_page
        self.page_variable = page_variable
        self.allow_empty_first_page = allow_empty_first_page
        self._count = object_count
        self._num_pages = None

    def page(self, number, default_to_last_page=False):
        # When we default to the last page. We want the last page to be filled, while
        # the first one may contain orphan items.
        if default_to_last_page:
            top = self.count - self.per_page * (self.num_pages - number)
            bottom = top - self.per_page
            if bottom < 0:
                bottom = 0
        else:
            bottom = (number - 1) * self.per_page
            top = bottom + self.per_page
            if top >= self.count:
                top = self.count

        return Page(self.object_list[bottom:top], number, self)

    @property
    def count(self):
        'Returns the total number of objects, across all pages.'
        if self._count is None:
            try:
                self._count = self.object_list.count()
            except (AttributeError, TypeError):
                # AttributeError if object_list has no count() method.
                # TypeError if object_list.count() requires arguments
                # (i.e. is of type list).
                self._count = len(self.object_list)
        return self._count

    @property
    def num_pages(self):
        'Returns the total number of pages.'
        if self._num_pages is None:
            if self.count == 0 and not self.allow_empty_first_page:
                self._num_pages = 0
            else:
                hits = max(1, self.count)
                self._num_pages = int(ceil(hits / float(self.per_page)))
        return self._num_pages

    @property
    def page_range(self):
        """
        Returns a 1-based range of pages for iterating through within
        a template for loop.
        """
        return range(1, self.num_pages + 1)


class Page(object):
    def __init__(self, object_list, number, paginator):
        self.object_list = object_list
        self.number = number
        self.paginator = paginator

    def __repr__(self):
        return '<Page {} of {}>'.format(self.number, self.paginator.num_pages)

    def has_next(self):
        return self.number < self.paginator.num_pages

    def has_previous(self):
        return self.number > 1

    def has_other_pages(self):
        return self.has_previous() or self.has_next()

    def next_page_number(self):
        return self.number + 1

    def previous_page_number(self):
        return self.number - 1

    def start_index(self):
        """
        Returns the 1-based index of the first object on this page,
        relative to total objects in the paginator.
        """
        # Special case, return zero if no items.
        if self.paginator.count == 0:
            return 0
        return (self.paginator.per_page * (self.number - 1)) + 1

    def end_index(self):
        """
        Returns the 1-based index of the last object on this page,
        relative to total objects found (hits).
        """
        # Special case for the last page because there can be orphans.
        if self.number == self.paginator.num_pages:
            return self.paginator.count
        return self.number * self.paginator.per_page


def paginate(request,
             object_list,
             num_per_page=10,
             object_count=None,
             query_string_parameters=None,
             page_variable='page',
             default_to_last_page=False,
             use_get_parameters=False):
    """
    Paginate an object list. Wrapper around the Django paginator.
    """

    paginator = Paginator(object_list, num_per_page, object_count=object_count, page_variable=page_variable)

    # Page number?
    page_num = request.GET.get(page_variable, None)
    number_of_pages = paginator.num_pages

    if page_num:
        try:
            page_num = int(page_num)
            page_num = max(page_num, 1)  # Make sure page number isn't negative.
            page_num = min(page_num, number_of_pages)  # Make sure the pagenumber isn't bigger than the number of pages.
        except ValueError:
            page_num = 1
    else:
        # Default start page
        if default_to_last_page:
            page_num = number_of_pages
        else:
            page_num = 1

    # Create output page instance
    output_page = paginator.page(page_num, default_to_last_page)

    # Query string parameters
    output_page.additional_parameters = query_string_parameters or {}

    output_page.page_variable = page_variable
    output_page.use_get_parameters = use_get_parameters
    output_page.request = request

    return output_page
