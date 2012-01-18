<?php

$page->addContent(
				'</div>',
			'</div>',
			'<div id="footer">',
				'<div class="section">',
				'</div>',
			'</div>',
		'</div>',
		'<ul id="lang-select">',
			'<li class="text">w&auml;hle deine Sprache&nbsp;&nbsp;/&nbsp;&nbsp;choose your language </li>'
);
foreach( i18n::getLangs() as $key => $lang )
	$page->addContent(
			'<li><a href="'.i18n::url( ( substr($page->getId(),0,1)=='#' ? '.' : $page->getId() ),$key).'" title="'.$lang['name'].'" class="'.$key.'"></a></li>'
	);
$page->addContent(
		'</ul>',
		( $site->getOption('debug_mode') ?
			'<script type="text/javascript" src="js/libs/jquery-1.7.1.js"></script>'.
			'<script type="text/javascript" src="js/libs/jquery-ui-1.8.16.js"></script>'.
			'<script type="text/javascript" src="js/libs/jquery-ui-selectmenu-1.2.0.js"></script>'
		:
			'<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>'.
			'<script type="text/javascript">window.jQuery || document.write(\'<script type="text/javascript" src="js/libs/jquery-1.7.1-min.js"><\/script>\')</script>'.
			'<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min.js"></script>'.
			'<script type="text/javascript">window.jQuery.ui || document.write(\'<script type="text/javascript" src="js/libs/jquery-ui-1.8.16-min.js"><\/script>\')</script>'.
			'<script type="text/javascript" src="js/libs/jquery-ui-selectmenu-1.2.0-min.js"></script>'
		),
		'<script type="text/javascript" src="js/script.'.( $site->getOption('debug_mode') ? time() : $site->getOption('tpl_version') ).'.js"></script>',
		( $_SERVER['HTTP_HOST']!='localhost' && ( !User::isLoggedIn() || !User::_()->hasRight('admin') ) ?
			'<script type="text/javascript">'.
				'var _gaq=[["_setAccount","UA-27609112-1"],["_trackPageview"]];'.
				'(function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];g.async=1;'.
				'g.src=("https:"==location.protocol?"//ssl":"//www")+".google-analytics.com/ga.js";'.
				's.parentNode.insertBefore(g,s)}(document,"script"));'.
			'</script>'
		:''),
	'</body>',
	'</html>'
);

?>
