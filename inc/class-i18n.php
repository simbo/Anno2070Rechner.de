<?php
/**
 * class-i18n.php
 *
 * @package Anno2070Rechner
 */

/**
 * i18n
 *
 * @abstract
 * @package Anno2070Rechner
 */

abstract class i18n {

	private static $default_lang = 'de',
		$lang = null,
		$langs = array(
			'de' => array(
				'name' => 'Deutsch (Deutschland)',
				'short' => 'de',
				'textdomain' => 'de_DE.utf8',
				'codeset' => 'UTF-8'
			),
			'en' => array(
				'name' => 'English (US)',
				'short' => 'en',
				'textdomain' => 'en_US.utf8',
				'codeset' => 'UTF-8'
			)
		);
	
	public static function init() {
		$request_params = strpos($_SERVER['REQUEST_URI'],'?')===false ? '' : substr( $_SERVER['REQUEST_URI'], strpos($_SERVER['REQUEST_URI'],'?') );
		$request_uri = strpos($_SERVER['REQUEST_URI'],'?')===false ?
			substr( $_SERVER['REQUEST_URI'], strlen(BASEDIR) )
			: substr( $_SERVER['REQUEST_URI'], strlen(BASEDIR), strpos($_SERVER['REQUEST_URI'],'?')-strlen(BASEDIR) );
		if( substr($request_uri,-1)!='/' ) {
			$lang_part = strrpos($request_uri,'/')===false && strlen($request_uri)==2 ? $request_uri : substr($request_uri,strrpos($request_uri,'/')+1);
			if( isset(self::$langs[$lang_part]) ) {
				self::setLang($lang_part);
				$request_uri = substr($request_uri,0,strrpos($request_uri,'/'));
				$_SERVER['REQUEST_URI'] = BASEDIR.$request_uri.$request_params;
				if( $lang_part==self::$default_lang )
					Site::_()->redirect( BASEURL.$request_uri.(empty($_SERVER['QUERY_STRING'])?'':'?'.$_SERVER['QUERY_STRING']), false );
			}
		}
		self::set();
	}
	
	public static function set() {
		putenv( 'LC_ALL='.self::getTextdomain() );
		setlocale( LC_ALL, self::getTextdomain() );
		bindtextdomain( 'messages', ABSPATH.'i18n' );
		textdomain( 'messages' );
		bind_textdomain_codeset( 'messages', self::getCodeset() );
	}
	
	public static function url( $url, $key=null ) {
		$key = isset(self::$langs[$key]) ? $key : self::getLang();
		if( $key!=self::$default_lang ) {
			$params = strpos($url,'?')===false ? '' : substr( $url, strpos($url,'?') );
			$uri = strpos($url,'?')===false ? $url : substr( $url, 0, strpos($url,'?') );
			$url = ( empty($uri) ? '' : _::eslash($uri) ).$key.$params;
		}
		return $url;
	}
	
	public static function __( $str ) {
		return gettext($str);
	}
	
	public static function _e( $str ) {
		echo self::__($str);
	}
	
	public static function setLang( $key ) {
		if( isset(self::$langs[$key]) )
			self::$lang = $key;
	}
	
	public static function getLang() {
		return !empty(self::$lang) ? self::$lang : self::$default_lang;
	}
	
	public static function getLangs() {
		return self::$langs;
	}
	
	public static function getName() {
		return self::$langs[self::getLang()]['name'];
	}

	public static function getShort() {
		return self::$langs[self::getLang()]['short'];
	}

	public static function getTextdomain() {
		return self::$langs[self::getLang()]['textdomain'];
	}

	public static function getCodeset() {
		return self::$langs[self::getLang()]['codeset'];
	}

}

function __($str) {
	return i18n::__($str);
}

function _e($str) {
	i18n::_e($str);
}

?>
