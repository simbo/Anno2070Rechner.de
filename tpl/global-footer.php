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
	'</body>',
	'</html>'
);

?>
