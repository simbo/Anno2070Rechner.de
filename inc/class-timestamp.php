<?php
/**
 * class-timestamp.php
 *
 * @package qmTools
 */

/**
 * Timestamp
 * 
 * collection of static timestamp functions
 *
 * @package qmTools
 * @abstract
 */
abstract class Timestamp {
	
	/**
	 * local
	 * 
	 * returns local timestamp of now
	 *
	 * @static
	 * @return int
	 */
	public static function local() {
		return time();
	}
	
	/**
	 * utc
	 * 
	 * returns utc timestamp of now
	 *
	 * @static
	 * @return int
	 */
	public static function utc() {
		return strtotime( gmdate( 'Y-m-d H:i:s', self::local() ) );
	}
	
	/**
	 * toUtc
	 * 
	 * calculates an utc timestamp from a local timestamp
	 *
	 * @static
	 * @param int $local
	 * @return int
	 */
	public static function toUtc( $local ) {
		return $local - self::diff();
	}
	
	/**
	 * toLocal
	 * 
	 * calculates a local timestamp from an utc timestamp
	 *
	 * @static
	 * @param int $utc
	 * @return int
	 */
	public static function toLocal( $utc ) {
		return $utc + self::diff();
	}
	
	/**
	 * diff
	 * 
	 * returns difference between local timestamp and utc timestamp
	 *
	 * @static
	 * @return int
	 */
	public static function diff() {
		$local = self::local();
		$utc = strtotime(gmdate('Y-m-d H:i:s',$local));
		return $local - $utc;
	}
	
	/**
	 * zone
	 * 
	 * returns the timezone
	 *
	 * @static
	 * @return string
	 */
	public static function zone() {
		return date_default_timezone_get();
	}

}

?>
