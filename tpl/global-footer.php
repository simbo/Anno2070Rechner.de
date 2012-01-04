<?php

$page->addContent(
				'</section>',
			'</div>',
			'<footer>',
				'<section>',
				'</section>',
			'</footer>',
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
		( !User::isLoggedIn() || !User::_()->hasRight('admin') ?
			'<script type="text/javascript">'.
				'var _gaq = _gaq || [];'.
				'_gaq.push([\'_setAccount\', \'UA-27609112-1\']);'.
				'_gaq.push([\'_trackPageview\']);'.
				'(function() {'.
				'var ga = document.createElement(\'script\'); ga.type = \'text/javascript\'; ga.async = true;'.
				'ga.src = (\'https:\' == document.location.protocol ? \'https://ssl\' : \'http://www\') + \'.google-analytics.com/ga.js\';'.
				'var s = document.getElementsByTagName(\'script\')[0]; s.parentNode.insertBefore(ga, s);'.
				'})();'.
			'</script>'
		:''),
	'</body>',
	'</html>'
);

?>
