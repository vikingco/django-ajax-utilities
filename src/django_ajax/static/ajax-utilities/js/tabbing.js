// Author: Jonathan Slenders, City Live


/* AJAX based tabs
 *
 * Include script in the bottom of HTML file.
 * Don't use multiple tab controls on a single page.
 *
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
 *            ...
 *
 *              <a class="tabbing-helper" href="..."> (something which opens in this tab) </a>
 *
 *
 *      </div>
 * </div>
 * */

(function() {
    /*$(document).bind('tabLoaded', function(e, containers) {
        // Support for nested tab pages, when the content of
        // an parent-tab is loaded, look for child tabs inside.
        for (var i in containers)
            handleTabs(containers[i]);
    });*/

    function handleTabs(content)
    {
        content.find('.tabbing').each(function() {
            var tabs = $(this).find('.tabbing-tabs');
            var loader = $(this).find('.tabbing-loader');
            var content_tab = $(this).find('.tabbing-content');
            var no_ajax = $(this).is('.no-ajax');
            var nest_level = $(this).parents('.tabbing-content').length;

            function activate_tabbing_helpers(this_tab)
            {
                // When the user clicks on a <a class='tabbing-helper" href="..."> link
                // open the link inside this tab.
                content_tab.find('a.tabbing-helper').each(function() {
                    process_link($(this), this_tab, false, true);
                });
            }

            function process_link(link, this_tab, preload, is_helper, link_not_via_ajax)
            {
                var loaded_content = undefined; // Cache
                var loaded_title = undefined;
                var href= link.attr('href');
                var link_no_ajax = no_ajax || link_not_via_ajax;

                if (! is_helper && this_tab.hasClass('selected'))
                {
                    loaded_content = content_tab.html();
                    loaded_title = $('head title').text();
                }

                function update_form_actions()
                {
                    // When a form's action attribute starts with a question mark,
                    // it should submit to the page where it was originally comming from.
                    // So, prefix it with the current URL
                    $(content_tab).find('form').each(function() {
                        var action = $(this).attr('action');
                        if (action !== undefined && action !== false && action.match(/^\?/))
                            $(this).attr('action', href + action)
                    });
                }

                function show_loader()
                {
                    //loader.show();
                    content_tab.html(loader.html());
                }
                function hide_loader()
                {
                    // Hide loading message
                    //loader.hide();
                    content_tab.empty();
                }

                function success_handler()
                {
                    hide_loader();

                    // Replace tab content and page title
                    content_tab.empty();
                    content_tab.html(loaded_content);
                    document.title = loaded_title;

                    // Look for tabbing-helpers in this tab's content
                    activate_tabbing_helpers(this_tab);

                    update_form_actions();

                    // Restore tab height
                    content_tab.css('height', '');

                    // Trigger signal (Used for pagination/xhr to initialize again in this container.)
                    $(document).trigger('tabLoaded', [ [ content_tab ] ]);
                }

                function load_content(success)
                {
                    // Dynamically load content.
                    $.ajax({
                        type: 'GET',
                        url: href,
                        datatype: 'html',
                        success: function(html) {
                            if (! loaded_content)
                            {
                                loaded_content = $(html).find('.tabbing-content').eq(nest_level).html();
                                //loaded_title = $(html).find('title').html(); // This does not work
                                loaded_title = html.replace(/\n/g,' ').replace(/.*\<title\>/, '').replace(/\<\/title\>.*/, '');
                            }
                            success();
                        },
                        error: function() {
                            loaded_content  = 'Loading error...';
                        }
                    });
                }

                if (preload && ! link_no_ajax)
                {
                    if (! loaded_content)
                        load_content(function () { });
                }

                // When this tab has been clicked.
                link.click(function() {
                    // Remain tab container height, until loaded
                    // (this avoids anoying scrolling sometimes.)
                    var height = content_tab.height();
                    content_tab.css('height', (height < 50 ? '50px' : height + 'px'));

                    // Select this menu item
                    tabs.find('li').removeClass('selected');
                    this_tab.addClass('selected');

                    // Save path in the URL hash.
                    location.hash = 'page:' + href;

                    // When no_ajax is used, don't load the tab content.
                    // Just show the loader, and allow the default
                    // behaviour of the hyperlink.

                    if (loaded_content)
                        success_handler();
                    else
                    {
                        // Show loading message
                        content_tab.empty();
                        show_loader();

                        // Load  content
                        if (! link_no_ajax)
                            load_content(success_handler);
                    }
                    return link_no_ajax;
                });

                // If the location hash mathes the path of this tab,
                // switch to this tab when loading this page.
                if (! is_helper && location.hash.match( /^#page/))
                    if (location.hash.replace( /^#page:/, '') == href)
                        link.click();
            }

            // For each tab
            $(this).find('.tabbing-tabs ul li').each(function() {
                var this_tab = $(this);
                var preload = ($(this).attr('x:tabbing-preload') == 'true');
                var link_no_ajax = ($(this).attr('x:no-ajax') == 'true');

                $(this).find('a').eq(0).each(function() {
                    process_link($(this), this_tab, preload, false, link_no_ajax);
                });
            });

            // And each tabbing helper inside the tab
            if (! no_ajax)
                activate_tabbing_helpers($(this).find('ul li.selected'));
        });
    }
    handleTabs($('body'));
}) ();
