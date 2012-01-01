<?php
/**
 * class-session.php
 *
 * @package Anno2070Rechner
 */

/**
 * Session
 *
 * @package Anno2070Rechner
 * @abstract
 */
abstract class Session {

	/**
	 * init
	 * 
	 * set session handlers
	 *
	 * @static
	 * @return void
	 */
	public static function init() {
		if( @session_set_save_handler(
			array('Session','callback_open'),
			array('Session','callback_close'),
			array('Session','callback_read'),
			array('Session','callback_write'),
			array('Session','callback_destroy'),
			array('Session','callback_gc')
		) ) {
			register_shutdown_function('session_write_close');
			return self::start();
		}
		else
			Site::dieOnError('Session::init() failed');
	}
	
	/**
	 * start
	 * 
	 * starts the session
	 *
	 * @static
	 * @return void
	 */
	public static function start() {
		if( @session_start() )
			return true;
		else
			Site::dieOnError('Session::start() failed');
			
	}
	
	/**
	 * destroy
	 * 
	 * destroys the session
	 *
	 * @static
	 * @return void
	 */
	public static function destroy() {
		@session_unset();
		if( @session_destroy() )
			return true;
		else
			Site::dieOnError('Session::destroy() failed');
	}
	
	/**
	 * restart
	 * 
	 * destroys and starts the session
	 *
	 * @static
	 * @return bool
	 */
	public static function restart() {
		self::destroy();
		self::start();
		return true;
	}
	
	/**
	 * callback_open
	 * 
	 * Session open handler
	 *
	 * @static
	 * @param string $path=''	Session save path
	 * @param string $name=''	Session name
	 * @return bool
	 */
	public static function callback_open( $path='', $name='' ) {
		return true;
	}

	/**
	 * callback_close
	 * 
	 * Session close handler
	 *
	 * @static
	 * @return bool
	 */
	public static function callback_close() {
		return true;
	}

	/**
	 * callback_read
	 * 
	 * Session read handler
	 *
	 * @static
	 * @param string $id
	 * @return bool
	 */
	public static function callback_read( $id ) {
		$sql = "SELECT * FROM sessions WHERE id = '".$id."' LIMIT 0,1";
		$query = Database::_()->query($sql);
		return ($row=$query->fetch_assoc()) ? unserialize(stripslashes($row['data'])) : false;
	}
	
	/**
	 * callback_write
	 * 
	 * Session write handler
	 *
	 * @static
	 * @param string $id
	 * @param mixed $data
	 * @return bool
	 */
	public static function callback_write( $id, $data ) {
		$sql = "REPLACE INTO sessions VALUES ('".$id."','".addslashes(serialize($data))."',".time().")";
		return Database::_()->query($sql) ? true : false;
	}

	/**
	 * callback_destroy
	 * 
	 * Session destroy handler
	 *
	 * @static
	 * @param string $id
	 * @return bool
	 */
	public static function callback_destroy( $id ) {
		$sql = "DELETE FROM sessions WHERE id = '".$id."'";
		$q = Database::_()->query($sql);
		return $q ? true : false;
	}

	/**
	 * callback_gc
	 * 
	 * Session garbage collector handler
	 *
	 * @static
	 * @param int $timeout
	 * @return bool
	 */
	public static function callback_gc( $timeout ) {
		$timeout = (int) $timeout;
		$sql = "DELETE FROM sessions WHERE (time+".$timeout.") < ".time();
		return Database::_()->query($sql) ? true : false;
	}

}

?>
