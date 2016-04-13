/* AJAX based tabs
 *
 * Include script in the bottom of HTML file.
 * Don't use multiple tab controls on a single page.
 *
 * <div class="tabbing">
 *      <div class="tabbing-tabs">
 *          <ul>
 *              <li><a href="...">...</a></li>
 *              <li x:tabbing-preload="true"><a href="...">...</a></li>
 *              <li><a href="...">...</a></li>
 *          </ul>
 *      </div>
 *      <div class="tabbing-loader" style="display: none;">
 *          ...
 *      </div>
 *      <div class="tabbing-content">
 *          ...
 *          <a class="tabbing-helper" href="..."> (something which opens in this tab) </a>
 *      </div>
 * </div>
 * */

(function() {
    function initializeTabs(content)
    {
        // Find each block of tabs
        content.find('.tabbing').each(function()
        {
            // The tab controls
            var tabs = $(this).find('.tabbing-tabs');
            // The loader to be shown while a new tab is requested
            var loader = $(this).find('.tabbing-loader');
            // The div to render the content of the tabs in
            var content_tab = $(this).find('.tabbing-content');
            // Whether ajax shouldn't be used
            var no_ajax = $(this).is('.no-ajax');
            // The nesting level of the content relative to the tab block
            var nest_level = $(this).parents('.tabbing-content').length;

            // The main function that attaches a handler to a link that makes it a tab
            // Arguments:
            //  link: the tab control link to attach the handler to
            //  this_tab: the currently active tab
            //  preload: whether the tab should be preloaded
            //  is_helper: whether this is an internal call
            //  link_not_via_ajax: whether the link should not be loaded via ajax
            function process_link(link, this_tab, preload, is_helper, link_not_via_ajax)
            {
                // The last loaded content. Can be used as a cache
                var loaded_content = undefined;
                // The last loaded title. Can be used as a cache
                var loaded_title = undefined;
                // The address of the link
                var href = link.attr('href');
                // Whether the link should not use ajax
                var link_no_ajax = no_ajax || (link_not_via_ajax === true);

                // Cache the current content and title
                if (!is_helper && this_tab.hasClass('selected'))
                {
                    loaded_content = content_tab.html();
                    loaded_title = $('head title').text();
                }

                // The success handler function to be called after a new tab request finished
                function success_handler()
                {
                    // Clean the content block
                    content_tab.empty();

                    // Replace tab content and page title
                    content_tab.html(loaded_content);
                    document.title = loaded_title;

                    // Look for tabbing-helpers in this tab's content, and attach handlers to it as well
                    content_tab.find('a.tabbing-helper').each(function(){process_link($(this), this_tab, false, true);});

                    // Restore tab height
                    content_tab.css('height', '');

                    // Trigger a signal to indicate a new tab has loaded
                    $(document).trigger('tabLoaded', [ [ content_tab ] ]);
                }

                // The loader function for the content of a tab
                // Arguments:
                //  success: the success handler to be called when the tab is loaded
                function load_content(success)
                {
                    $.ajax(
                    {
                        type: 'GET',
                        url: href,
                        datatype: 'html',
                        success: function(html)
                        {
                            loaded_content = $(html).find('.tabbing-content').eq(nest_level).html();
                            loaded_title = html.match(/\<title\>([^\<]*)\<\/title\>/gm)[0].replace(/\<\/?title\>/g, '');
                            success();
                        },
                        error: function()
                        {
                            loaded_content  = 'Loading error...';
                        }
                    });
                }

                // If we want to preload and haven't yet, do so
                if (preload && !link_no_ajax && !loaded_content)
                {
                    load_content(function(){});
                }

                // Attach the click handler
                link.click(function()
                {
                    // Save the height of the current content to avoid anoying scrolling
                    var height = content_tab.height();
                    content_tab.css('height', (height < 50 ? '50px' : height + 'px'));

                    // Select this menu item
                    tabs.find('li').removeClass('selected');
                    this_tab.addClass('selected');

                    // Rewrite the url to the new one
                    history.replaceState({}, loaded_title, href);

                    // When no_ajax is used, don't load the tab content. Just show the loader, and allow the default
                    // behaviour of the hyperlink.
                    if (loaded_content && !link_no_ajax)
                    {
                        success_handler();
                    }
                    else
                    {
                        // Show loading message
                        content_tab.empty();
                        content_tab.html(loader.html());

                        // Load content
                        if (!link_no_ajax)
                        {
                            load_content(success_handler);
                        }
                    }

                    return link_no_ajax;
                });
            }

            // For each tab control
            $(this).find('.tabbing-tabs ul li').each(function()
            {
                // The current tab control
                var this_tab = $(this);
                // Should the tab be preloaded
                var preload = ($(this).attr('x:tabbing-preload') == 'true');
                // Should the loading use ajax
                var link_no_ajax = ($(this).attr('x:no-ajax') == 'true');

                // Attach a handler to the link in the tab control
                $(this).find('a').eq(0).each(function(){process_link($(this), this_tab, preload, false, link_no_ajax);});
            });

            // If we use ajax, attach a handler to the tabbing helpers as well
            if (!no_ajax)
            {
                content_tab.find('a.tabbing-helper').each(function()
                {
                    process_link($(this), $(this).find('ul li.selected'), false, true);
                });
            }
        });
    }
    initializeTabs($('body'));
}) ();
