<?php
/**
 * class-site.php
 *
 * @package Anno2070Rechner
 */

/**
 * Site
 *
 * @package Anno2070Rechner
 * @final
 */
final class Site {

	private static $instance = null,
		$ini_contents = null;
	
	private $config = array(),
		$pages = array(),
		$pagegroups = array(),
		$page = null,
		$pageID = '';
		
	/**
	 * getInstance
	 * 
	 * Site is a singleton class and this function returns its instance
	 *
	 * @static
	 * @return Site
	 */
	public static function getInstance() {
		if( self::$instance === null ) {
			self::$instance = new self;
			self::$instance->init();
		}
		return self::$instance;
	}
	
	/**
	 * _
	 * 
	 * alias for Site::getInstance()
	 *
	 * @see Site::getInstance()
	 */
	public static function _() {
		return call_user_func_array( 'self::getInstance', func_get_args() );
	}
	
	/**
	 * dieOnError
	 * 
	 * output an error message and die
	 *
	 * @static
	 * @param string $msg
	 * @return void
	 */
	public static function dieOnError( $msg=null ) {
		if( is_string($msg) && !empty($msg) ) {
			header('Content-Type: text/plain; charset=UTF-8');
			echo 'ERROR: '.$msg;
		}
		die();
	}

	/**
	 * getConfig
	 *
	 * @static
	 * @param string $section=''	section name
	 * @return array				section options
	 */
	public static function getIniContents( $file='' ) {
		if( empty(self::$ini_contents) ) {
			$c = array();
			$c['site'] = @parse_ini_file( ABSPATH.'conf/site.ini', false );
			$c['pages'] = @parse_ini_file( ABSPATH.'conf/pages.ini', true );
			$c['pagegroups'] = @parse_ini_file( ABSPATH.'conf/pagegroups.ini', true );
			$c['mysql'] = @parse_ini_file( ABSPATH.'conf/mysql.ini', false );
			foreach($c as $a)
				if(!is_array($a))
					self::dieOnError('parse_ini_file failed');
			self::$ini_contents = $c;
		}
		return isset(self::$ini_contents[$file]) ? self::$ini_contents[$file] : self::$ini_contents;
	}
	
	/**
	 * autoload
	 * 
	 * this function will be implemented into __autoload
	 *
	 * @static
	 * @param string $classname
	 * @return void
	 */
	public static function autoload( $classname ) {
		if( self::_()->getOption('debug_mode') )
			error_reporting(E_ALL);
		$classname = strtolower($classname);
		$filename = dirname(__FILE__).'/class-'.$classname.'.php';
		if( preg_match('/^[-_a-z0-9]+$/',$classname) && @is_readable($filename) )
			require_once $filename;
	}
	
	/**
	 * __construct
	 *
	 * @return void
	 */
	private function __construct() {}

	/**
	 * __clone
	 *
	 * @return void
	 */
	private function __clone() {}
	
	/**
	 * __destruct
	 *
	 * @return void
	 */
	public function __destruct() {}
	
	/**
	 * init
	 *
	 * @return void
	 */
	private function init() {
		spl_autoload_register('Site::autoload',false,true);
		$this->setConstants();
		i18n::init();
		$this->parseRequest();
		$this->setConfig();
		if( $this->config['debug_mode']===true )
			error_reporting(E_ALL);
		$this->setPage();
		$this->parseRedirect();
		$_POST = $this->filterPostdata($_POST);
		$_GET = $this->filterPostdata($_GET);
		$_REQUEST = $this->filterPostdata($_REQUEST);
		Session::init();
		if( !User::isLoggedIn() )
			User::cookieAuth();
		$this->ensureRights();
	}
	
	/**
	 * setConstants
	 *
	 * @return void
	 */
	private function setConstants() {
		if( defined('ABSPATH') || defined('BASEDIR') || defined('BASEURL') || defined('FILEUPLOADS') )
			self::dieOnError('Site::setConstants() failed; one ore more site constants are already defined');
		define( 'ABSPATH', _::eslash(substr(dirname(__FILE__),0,-4)) );		// absolute path
		define( 'BASEDIR', _::eslash(dirname($_SERVER['PHP_SELF'])) );		// relative path
		$protocol = 'http'.( isset($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS'])=='on' ? 's' : '' ).'://';	// http or https
		define( 'BASEURL', $protocol.$_SERVER['HTTP_HOST'].BASEDIR );	// relative path with domain and protocol
		define( 'FILEUPLOADS', ABSPATH.'uploads/' );	// absolute path to upload directory
	}
	
	/**
	 * parseRequest
	 *
	 * @return void
	 */
	private function parseRequest() {
		// requested url without basedir and querystring
		$this->request = strpos($_SERVER['REQUEST_URI'],'?')===false ?
			substr( $_SERVER['REQUEST_URI'], strlen(BASEDIR) )
		  : substr( $_SERVER['REQUEST_URI'], strlen(BASEDIR), strpos($_SERVER['REQUEST_URI'],'?')-strlen(BASEDIR) );
		// if ends on slash, redirect to url without slash
		if( substr($this->request,-1)=='/' )
			$this->redirect( BASEURL.substr($this->request,0,-1).(empty($_SERVER['QUERY_STRING'])?'':'?'.$_SERVER['QUERY_STRING']), true );
		// if "index.php" requested, redirect to basedir
		if( $this->request=='index.php' )
			$this->redirect( BASEURL.(empty($_SERVER['QUERY_STRING'])?'':'?'.$_SERVER['QUERY_STRING']), true );
	}
	
	/**
	 * redirect
	 *
	 * @param string $target			redirect target
	 * @param bool $permanent=false		temporary 307 (false), permanently 301 (true)
	 * @return void
	 */
	public function redirect( $target, $permanent=false ) {
		header( $permanent ? 'HTTP/1.1 301 Moved Permanently' : 'HTTP/1.1 307 Temporary Redirect' );
		header( 'Location: '.$target ); 
		die();
	}
	
	/**
	 * filterPostdata
	 * 
	 * perform stripslashes on strings in post data if necessary
	 *
	 * @return void
	 */
	public function filterPostdata($post) {
	    if( version_compare(phpversion(),'5.3','<=') || ( function_exists('get_magic_quotes_gpc') && get_magic_quotes_gpc() ) ) {
			foreach( $post as $k => $v )
				if( is_string($v) )
					$post[$k] = stripslashes($v);
				elseif( is_array($v) )
					$post[$k] = $this->filterPostdata($v);
		}
		return $post;
	}
	
	/**
	 * setConfig
	 * 
	 * sets configuration options from ini files
	 *
	 * @return void
	 */
	private function setConfig() {
		$this->config = self::getIniContents('site');
		$this->pages = self::getIniContents('pages');
		$this->pagegroups = self::getIniContents('pagegroups');
	}
	
	/**
	 * getOption
	 *
	 * @param string $option=''		option key
	 * @return void
	 */
	public function getOption( $option='' ) {
		// site config option ausgeben
		return isset($this->config[$option]) ? $this->config[$option] : null;
	}

	/**
	 * getPages
	 *
	 * @return void
	 */
	public function getPages() {
		// pages ausgeben
		return $this->pages;
	}
	
	/**
	 * getPagegroups
	 *
	 * @return void
	 */
	public function getPagegroups() {
		// pagegroups ausgeben
		return $this->pagegroups;
	}
	
	/**
	 * setPage
	 *
	 * @return void
	 */
	private function setPage() {
		// falls keine Seite angefordert, Startseite festlegen
		if( empty($this->request) )
			$this->request = '#home';
		// falls angeforderte Seite existiert, diese festlegen
		if( isset($this->pages[$this->request]) )
			$this->pageID = $this->request;
		// ansonsten 404-Seite festlegen
		else
			$this->pageID = '#404';
		// Seitenobjekt definieren
		$this->page = new Page( $this->pageID );
	}
	
	/**
	 * parseRedirect
	 *
	 * @return void
	 */
	private function parseRedirect() {
		// falls Weiterleitung
		if( $this->page->getType() == 'redirect' )
			// falls Weiterleitungsziel existiert, weiterleiten
			if( isset($this->pages[$this->page->getRedirect()]) )
				$this->redirect( BASEURL.$this->page->getRedirect() );
			// ansonsten DieOnError
			else
				die('ERROR: Invalid redirection target in page configuration: "'.$this->page->getRedirect().'"');
	}
	
	/**
	 * ensureRights
	 *
	 * @return void
	 */
	private function ensureRights() {
		$rights = $this->page->getRights();
		if( !empty($rights) ) {
			if( !User::isLoggedIn() )
				$this->redirect( BASEURL.'login' );
			elseif( !User::_()->hasRights($rights) ) {
				$this->pageID = '#no-rights';
				$this->page = new Page($this->pageID);
			}
		}
	}
	
	/**
	 * getPage
	 *
	 * @return Page
	 */
	public function getPage() {
		return $this->page;
	}
	
	/**
	 * getTitle
	 *
	 * @return string
	 */
	public function getTitle() {
		return $this->config['title'];
	}
	
	/**
	 * output
	 *
	 * @return void
	 */
	public function output() {
		if( $this->page->getID() == '#404' )
			header('HTTP/1.0 404 Not Found');
		switch( $this->page->getType() ) {
			case 'json':
				header('Cache-Control: no-store, no-cache, must-revalidate');
				header('Expires: 0');
				header('Content-type: text/json');
				echo json_encode($this->page->getContent());
				break;
			case 'html':
			default:
				header('Content-type: text/html;charset=UTF-8');
				echo implode( '', $this->page->getContent() );
				break;
		}
		die();
	}
	
}

?>
