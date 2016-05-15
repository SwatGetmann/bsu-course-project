$( document ).ready(function() {

  debugger

  var documentEl = $(document),
    parallaxBg1 = $('div.parallax-bg.parallax-1'),
    parallaxBg2 = $('div.parallax-bg.parallax-2');

  documentEl.on('scroll', function() {
    var currScrollPos = documentEl.scrollTop();
    parallaxBg1.css('background-position', '0 ' + (-currScrollPos+parallaxBg1.offset().top)/4 +'px');
    parallaxBg2.css('background-position', '0 ' + (-currScrollPos+parallaxBg2.offset().top)/4 +'px');
  });

});
