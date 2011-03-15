// Author: Jonathan Slenders, City Live

$(function() {
    function init(document_containers, path)
    {
        for (var i = 0; i < document_containers.length; i ++)
            // If the current page contains xhr_container divs
            if(document_containers[i].find('.xhr_container').length)
            {
                // Do XHR for the current page, append ?xhr
                var url = path;

                if (url.indexOf('&xhr') <= 0 && url.indexOf('?xhr') <= 0)
                {
                    if (url.indexOf('?') > 0)
                        url += '&xhr';
                    else
                        url += '?xhr';
                }

                // Replace XHR containers with the actual data received through the AJAX request
                function handler(html)
                {
                    var newContainers = [];
                    var newContainers2 = [];

                    $(html).find('.xhr_container').each(function(){
                        newContainers.push($(this));
                    });

                    $('.xhr_container').each(function(){
                        var newContent = newContainers.shift();
                        newContainers2.push($(this));

                        // Only load once
                        if (! $(this).hasClass('xhr-loaded'))
                        {
                            $(this).addClass('xhr-loaded');
                            $(this).empty();
                            $(this).html(newContent.html());
                        }
                    });

                    // Trigger loaded event
                    $(document).trigger('xhrLoaded', [newContainers2]);
                }

                function errorHandler(xhr, ajaxOptions, thrownError)
                {
                    $('.xhr_container').each(function(){
                        $(this).empty();
                        $(this).append(
                            $('<p />')
                                    .append('...') // Error: 0 is rather ugly.

                                    // .append($('<strong />').append('Error: '))
                                    // .append(xhr.status)
                                    // .append(thrownError)
                            );
                    });
                }

                $.ajax({
                        'type': 'GET',
                        'url': url,
                        'datatype': "html",
                        'cache': true,
                        'success': handler,
                        'error': errorHandler
                });
            }
   }
   // First time initialisation
   init(
            [ $(document) ],
            (''+document.location).replace( /[#].*/, ''));

   // When a tab page has been loaded, initialize again in the tab
   $(document).bind('tabLoaded', function(e, containers) {
        init(containers, (''+document.location).replace( /.*[#]page:/, ''));
   });

});
