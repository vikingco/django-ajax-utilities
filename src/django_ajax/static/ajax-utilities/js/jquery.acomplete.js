// Author: Jonathan Slenders, City Live

// The following script needs jquery.dimensions in order to get the scrolling work
//
//  ======================[ Example usage ]==========================
/*

        // The JSON response is supposed to return a list of dictionaries.

        $(function() {
            $('#id_q').acomplete({
                'url': function() { return '{% url helpdesk_search_autocomplete %}' + '?q='; },
                'advanced_search_url': function { return '{% url helpdesk_search %}' + '?q='; },
                'default_text': '{% trans "Search user" %}...',
                'loader': function() { return $('<p/>').append("{% trans "Loading" %}..."); },
                'formatItem': function(item, addItem) {
                        addItem(
                            $('<div/>').append(
                                $('<p class="search-complete-name"/>').text(item['name'])
                            ).append(
                                $('<p class="search-complete-email" />').text(item['email'])
                            ).append(
                                $('<p class="search-complete-meta" />').text(item['username'] + " | " + item['msisdn'])
                            ),
                            item['url']
                            );
                    }
            });

        });
*/


(function($) {
    $.fn.acomplete = function(settings){
        var widget = this;
        widget.attr('autocomplete', 'off');

        // Default settings
        var default_settings =
        {
            'formatItem': function(item, addItem) { },
            'url': function() { return '?q='; },
            'advanced_search_url': function() { return '?q='; },
            'loader': function() { return $('<p/>').append('Loading...'); },
            'no_results': function() { return $('<p/>').append('Sorry, no results could be found'); },
            'header': function() { return $('<p/>').css('display', 'none'); },
            'footer': function() { return $('<p/>'); },
            'results_loaded_callback': function(data) { }
        };
        settings = $.extend(false, default_settings, settings);

        // Create HTML
        var container = $('<div class="search-complete" />');
        var header = settings['header']();
        var ul = $('<ul class="lines" />');
        var footer = settings['footer']();
        var alternate = false;

        function positionContainer()
        {
            container.css({
                'position': 'absolute',
                'left': widget.offset().left,
                'top': widget.offset().top + widget.innerHeight() + 10,
                'width': widget.innerWidth(),
                'background-color': 'white'
            });
            ul.css({
                'position': 'relative',
                'overflow-y': 'auto',
                'overflow-x': 'hidden',
                'max-height': '400px'
            });

            container.show();
            ul.scrollTop(0);
        }
        var loader = settings['loader']();

        container.append(loader).append(header).append(ul).append(footer);
        $('body').append(container);
        container.hide();

        function clearItems()
        {
            ul.empty();
        }
        function hideItems()
        {
            ul.find('li').css('visibility', 'hidden');
        }

        function addItem(item, url)
        {
            // Create container for this item
            alternate = ! alternate;
            var li = $('<li/>').append(item);
            if (alternate)
                li.addClass('alternate');

            // Clicking this item, goes to this URL
            if (url)
                li.click(function() {
                    window.location = url;
                    return false;
                });

            ul.append(li);
        }

        var selected_item = -1;

        function select_item(item)
        {
            ul.find('li').eq(selected_item).removeClass('selected');

            var new_item = ul.find('li').eq(item);

            // If this index is still an existing li item.
            if (new_item.size())
            {
                selected_item = item;
                new_item.addClass('selected');

                // Make sure this item is visible
                var elemTop = new_item.position().top;
                var elemBottom = elemTop + new_item.outerHeight();

                var containerTop = ul.scrollTop();
                var containerBottom = containerTop + ul.height();

                if (containerTop > elemTop)
                {
                    ul.scrollTop(elemTop);
                }

                if (containerBottom < elemBottom)
                {
                    ul.scrollTop(elemBottom - ul.innerHeight());
                }
            }
        }

        function countItems() { return ul.find('li').size(); }

        // Search after nothing has been entered for .2sec
        var search_timeout = undefined;
        function triggerSearch()
        {
            search_timeout = setTimeout(search, 500);
        }
        function clearSearchTrigger()
        {
            if (search_timeout != undefined)
                clearTimeout(search_timeout);
        }

        // Handle arrow clicks and enter on widget
        widget.keyup(function(e){
            clearSearchTrigger();

            if (e.keyCode == 27) // Escape
            {
                container.hide();
            }
            else if (e.keyCode == 40) // Down
            {
                // Select next item
                select_item((selected_item + 1) % countItems());
                return false;
            }
            else if (e.keyCode == 34) // Page Down
            {
                select_item((selected_item + 2) % countItems());
                event.preventDefault();
                return false;
            }
            else if (e.keyCode == 38) // Up
            {
                // Select previous item
                select_item((selected_item - 1 + countItems()) % countItems());
                return false;
            }
            else if (e.keyCode == 33) // Page up
            {
                select_item((selected_item - 2 + countItems()) % countItems());
                event.preventDefault();
                return false;
            }
            else if (e.keyCode == 13) // Enter
            {
                if (e.ctrlKey || selected_item == -1)
                {
                    // Open advanced search
                    window.location = settings['advanced_search_url']() +
                                encodeURIComponent(widget.val());
                }
                else
                {
                    // Open selected item if one has been selected.
                    if (ul.find('li').eq(selected_item).length)
                        ul.find('li').eq(selected_item).click();
                }
                return false;
            }
            else
                triggerSearch();
        });

        // Hide results when clicking outside search box
        $('body').click(function() { container.hide(); });
        widget.click(function() { return false; });

        // Show/hide default value on blur/focus
        widget.blur(function() {
            if (widget.val() == '')
            {
                widget.val(settings['default_text']);
                widget.addClass('has-default-value');
            }
        });
        widget.focus(function() {
            if (widget.val() == settings['default_text'])
            {
                widget.val('');
                widget.removeClass('has-default-value');
            }
            else
            {
                last_search = '';
                search();
            }
        });
        widget.blur();

        // Search when keyup
        var last_jqxhr;
        var last_search = '';
        function search() {
            var query = widget.val();

            selected_item = -1;

            if (query.length >= 2)
            {
                // Only do an actual search when something has been changed
                // (This ignores arrow keypresses.)
                if (query != last_search)
                {
                    last_search = query;
                    
                    // Abort last request
                    if (last_jqxhr)
                        last_jqxhr.abort();

                    // Show loader, hide previous results
                    loader.show();
                    header.hide();
                    hideItems();
                    positionContainer();

                    last_jqxhr = $.ajax({
                            url: settings['url']() + encodeURIComponent(query),
                            dataType: 'json',
                            success: function(data) {
                                // If this result is from the last query (ignore late ajax responses.)
                                if (query == widget.val())
                                {
                                    loader.hide(); 

                                    // Hide loader and show search results
                                    clearItems();
                                    positionContainer();
                                    if (data['results'].length == 0)
                                        addItem(settings['no_results']());
                                    else
                                        for (var i in data['results'])
                                            settings['formatItem'](data['results'][i], addItem);

                                    settings['results_loaded_callback'](data);
                                }
                            }
                    });
                }
            }
            else
                container.hide();
        }
    };
})(jQuery);


