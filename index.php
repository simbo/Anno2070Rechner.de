<?php
/**
 * Front of the Anno2070Rechner application.
 *
 * @package Anno2070Rechner
 * @license GPL3
 * @author Simon Lepel
 * @version 0.2
 * @since Mi 08 Dec 2011 14:31:32 
 */

require_once 'inc/class-site.php';

// ready...
$site = Site::_();
$page = $site->getPage();

// steady...
foreach( $page->getTemplates() as $template )
	require $template;

// go!
$site->output();

?>
