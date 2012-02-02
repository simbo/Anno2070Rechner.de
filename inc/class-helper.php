<?php
/**
 * class-helper.php
 *
 * @package Anno2070Rechner
 */

/**
 * Helper
 * 
 * collection of useful static functions
 *
 * @package Anno2070Rechner
 * @abstract
 */
abstract class Helper {
	
	/**
	 * generateRandomString
	 * 
	 * $pool works like unix file permissions:
	 * 	0: none
	 * 	1: small letters
	 * 	2: numbers
	 * 	4: big letters
	 * 	8: special chars
	 * i.e.: $pool=5 will contain small and big letters
	 * 
	 * @static
	 * @param int $length=12		string length
	 * @param int $pool=7			character pool
	 * @param string $addChars=''	add characters to pool
	 * @return string				random string
	 */
	public static function generateRandomString( $length=12, $pool=7, $addChars='' ) {
		$pool = min(15,max(abs(intval($pool)),0));
		$length = max(abs(intval($length)),1);
		$chars = '';
		$_chars = array( 'abcdefghijklmnopqrstuvwxyz', '1234567890', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '@!$%&=?+*#-_,;.:<>\\/{}()[]|^"`\'~' );
		for( $i=count($_chars)-1; $i>=0; $i-- ) {
			$l = pow(2,$i);
			if( $pool-$l >= 0 ) {
				$chars .= $_chars[$i];
				$pool -= $l;
			}
		}
		if( is_string($addChars) && !empty($addChars) )
			$chars .= $addChars;
		while( strlen($chars)>0 && strlen($chars)<$length ) {
			$chars .= $chars;
		}
		return substr(str_shuffle($chars),0,$length);
	}
	
	/**
	 * isValidEmail
	 * 
	 * tests a string for valid email address
	 *
	 * @static
	 * @param string $email
	 * @return boolean
	 */
	public static function isValidEmail( $email ) {
		$options = array(
			'default' => false
		);
		return filter_var($email,FILTER_VALIDATE_EMAIL,$options)===false ? false : true;
	}
	
	/**
	 * isValidUrl
	 *
	 * @static
	 * @param string $url
	 * @return bool
	 */
	public static function isValidUrl( $url ) {
		$options = array(
			'default' => false,
			'flags' => array(
					FILTER_FLAG_SCHEME_REQUIRED,
					FILTER_FLAG_HOST_REQUIRED
				)
		);
		return filter_var($url,FILTER_VALIDATE_URL,$options)===false ? false : true;
	}
	
	/**
	 * @static
	 * @var array	already checked files for Helper::isReadableFile() and Helper::isWritableFile()
	 */
	private static $checkedFiles = array();
	
	/**
	 * isReadableFile
	 *
	 * @static
	 * @param string $file				absolute path to file
	 * @param boolean $forceTest=false	ignore cached results and force test
	 * @return boolean
	 */
	public static function isReadableFile( $file, $forceTest=false ) {
		if( !is_string($file) || empty($file) )
			return false;
		if( $forceTest || !isset(self::$checkedFiles[$file]) || !isset(self::$checkedFiles[$file]['readable']) || self::$checkedFiles[$file]['readable']===null )
			self::$checkedFiles[$file] = array(
				'readable' => @is_readable($file) ? true : false,
				'writable' => isset(self::$checkedFiles[$file]['writable']) ? self::$checkedFiles[$file]['writable'] : null
			);
		return self::$checkedFiles[$file]['readable'];
	}
	
	/**
	 * isWritableFile
	 *
	 * @static
	 * @param string $file				absolute path to file
	 * @param boolean $forceTest=false	ignore cached results and force test
	 * @return boolean
	 */
	public static function isWritableFile( $file, $forceTest=false ) {
		if( !is_string($file) || empty($file) )
			return false;
		if( $forceTest || !isset(self::$checkedFiles[$file]) || !isset(self::$checkedFiles[$file]['writable']) || self::$checkedFiles[$file]['writable']===null )
			self::$checkedFiles[$file] = array(
				'writable' => @is_writable($file) ? true : false,
				'readable' => isset(self::$checkedFiles[$file]['readable']) ? self::$checkedFiles[$file]['readable'] : null
			);
		return self::$checkedFiles[$file]['writable'];
	}
	
	/**
	 * trimmedExplode
	 * 
	 * like explode() but with trimmed results, empty results will be excluded
	 *
	 * @static
	 * @param unknown $delimiter
	 * @param unknown $string
	 * @param unknown $limit=null
	 * @return void
	 */
	public static function trimmedExplode( $delimiter, $string, $limit=null ) {
		$arr = array();
		$limit = is_int($limit) ? $limit : false;
		if( is_string($delimiter) && !empty($delimiter) && is_string($string) ) {
			$string = trim($string);
			$_arr = $limit!==false ? explode($delimiter,$string,$limit) : explode($delimiter,$string);
			foreach( $_arr as $s ) {
				$s = trim($s);
				if( $s!='' )
					array_push($arr,$s);
			}
		}
		return $arr;
	}
	
	/**
	 * parseParams
	 * 
	 * parse a parameter string like "foo=bar&array=4,2,7&text=Hello%20World" into a (multidimensional) array
	 *
	 * @static
	 * @param string $paramString
	 * @return array
	 */
	public static function parseParams( $paramString ) {
		$params = array();
		if( is_string($paramString) && !empty($paramString) ) {
			$_params = self::trimmedExplode('&',$paramString);
			foreach( $_params as $p ) {
				$p = self::trimmedExplode('=',$p,2);
				$key = $p[0];
				$value = self::trimmedExplode(',',$p[1]);
				foreach( $value as $i => $v )
					$value[$i] = urldecode($v);
				$params[$key] = count($value)==1 ? $value[0] : $value;
			}
		}
		return $params;
	}
	
	/**
	 * getTableFilters
	 *
	 * returns an array of options that i.e. can be parsed into a mysql select statement
	 * 
	 * @static
	 * @param array $params		params as returned by Helper::parseParams()
	 * @return array
	 */
	public static function getTableFilters( $params ) {
		$filters = array(
			'where' => array(),
			'sql_where' => '',
			'orderby' => '',
			'sort' => '',
			'sql_orderby' => '',
			'sql_append' => ''
		);
		if( !is_array($params) )
			return $filters;
		foreach( $params as $k => $v )
			if( !isset($filters[$k]) )
				$filters['where'][$k] = Database::_()->strPrep($v);
		if( isset($params['orderby']) )
			if( is_array($params['orderby']) ) {
				foreach( $params['orderby'] as $o )
					if( preg_match('/^[_a-z0-9]{2,}$/i',$o) )
						$filters['orderby'] .= ( empty($filters['orderby']) ? '' : ',' ).$o;
			}
			elseif( preg_match('/^[_a-z0-9]{2,}$/i',$params['orderby']) )
				$filters['orderby'] = $params['orderby'];
		if( isset($params['sort']) && in_array(strtolower($params['sort']),array('asc','desc')) )
			$filters['sort'] = strtolower($params['sort']);
		if( !empty($filters['orderby']) && empty($filters['sort']) )
			$filters['sort'] = 'asc';
		$filters['sql_orderby'] = empty($filters['orderby']) ? '' : " ORDER BY ".$filters['orderby']." ".strtoupper($filters['sort']);
		foreach( $filters['where'] as $k => $v )
			$filters['sql_where'] .= ( empty($filters['sql_where']) ? ' WHERE ' : ' AND ' ).$k.'='.$v;
		$filters['sql_append'] = $filters['sql_where'].$filters['sql_orderby'];
		return $filters;
	}
	
	/**
	 * eslash
	 * 
	 * adds an ending slash to the string if not already present
	 *
	 * @static
	 * @param string $str
	 * @return string
	 */
	public static function eslash( $str ) {
		return substr($str,-1)=='/' ? $str : $str.'/';
	}
	
	/**
	 * intoJavascript
	 * 
	 * returns a string with a html script tag, which defines the $varNames and $varValues in javascript
	 *
	 * @static
	 * @param string $varName
	 * @param mixed $varValue
	 * @param string $varName
	 * @param mixed $varValue
	 * ...
	 * @return void
	 */
	public static function intoJavascript() {
		$args = func_get_args();
		$vars = array();
		for( $i=0; $i<count($args)-1; $i=$i+2 )
			if( is_string($args[$i]) && isset($args[$i+1]) )
				array_push( $vars, $args[$i].'=$.parseJSON(\''.json_encode( $args[$i+1] ).'\')' );
		return empty($vars) ? '' : '<script type="text/javascript">/* <![CDATA[ */ var '.implode(',',$vars).';/* ]]> */</script>';
	}
	
	/**
	 * filesizeFormat
	 *
	 * @static
	 * @param int $size
	 * @param int $decimals=0
	 * @param string $dec_point=","
	 * @param string $thousands_sep="."
	 * @return string
	 */
	public static function filesizeFormat( $size, $decimals=null, $dec_point=null, $thousands_sep=null ) {
		$unit = array('B','KB','MB','GB','TB');
		$size = is_int($size) && $size>0 ? $size : 0;
		$decimals = is_int($decimals) && $decimals>=0 ? $decimals : 2;
		$dec_point = is_string($dec_point) ? $dec_point : ',';
		$thousands_sep = is_string($thousands_sep) ? $thousands_sep : '.';
		$u = 0;
		while( $size>1024 && $u<count($unit) ) {
			$size /= 1024;
			$u++;
		}
		return number_format($size,$decimals,$dec_point,$thousands_sep).' '.$unit[$u];
	}

	
	/**
	 * setCookie
	 *
	 * @static
	 * @param string $name
	 * @param mixed $value
	 * @param int $expiresInDays
	 * @return bool
	 */
	public static function setCookie( $name, $value, $expiresInDays ) {
		if( !is_string($name) || empty($value) || !is_int($expiresInDays) || $expiresInDays<=0 )
			return false;
		return setcookie( $name, $value, time()+(86400*$expiresInDays), BASEDIR, $_SERVER['HTTP_HOST']=='localhost'?null:'.'.$_SERVER['HTTP_HOST'], false, true ) ? true : false;
	}
	
	/**
	 * unsetCookie
	 *
	 * @static
	 * @param string $name
	 * @return bool
	 */
	public static function unsetCookie( $name ) {
		if( !is_string($name) )
			return false;
		return setcookie( $name, '', 1 ) ? true : false;
	}

	/**
	 * sendEmail
	 *
	 * @return void
	 */
	public static function sendEmail( $to, $from, $subject, $message ) {
		$_headers = array(
			'From' => $from,
			'Reply-To' => $from,
			'Return-Path' => $from,
			'X-Mailer' => '(PHP '.phpversion().' )',
			'X-Priority' => '3 (Normal)',
			'MIME-Version' => '1.0',
			'Content-Type' => 'text/plain; charset=utf-8',
			'Content-Transfer-Encoding' => 'quoted-printable'
		);
		$headers = '';
		foreach( $_headers as $k => $v )
			$headers .= $k.": ".$v."\n";
		$headers .= "\n".imap_8bit($message);
		if( @mail( $to, $subject, '', $headers, ' -f '.$from ) )
			return true;
		else
			return false;
	}


}

?>
