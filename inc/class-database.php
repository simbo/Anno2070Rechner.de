<?php
/**
 * class-database.php
 *
 * @package Anno2070Rechner
 */

/**
 * Database
 *
 * @package Anno2070Rechner
 * @final
 */
final class Database {

	private static $instance = null;
	
	private $mysqli,
		$queries,
		$options;
		
	/**
	 * getInstance
	 * 
	 * Database is a singleton class and this function returns its instance
	 *
	 * @static
	 * @return Database
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
	 * alias for Database::getInstance()
	 *
	 * @see Database::getInstance()
	 */
	public static function _() {
		return call_user_func_array( 'self::getInstance', func_get_args() );
	}
	
	/**
	 * buildInsertUpdateStatement
	 * 
	 * returns an "INSERT" statement with "ON DUPLICATE KEY UPDATE"
	 *
	 * @static
	 * @param string $table
	 * @param array $data		column names => values
	 * @return void
	 */
	public static function buildInsertUpdateStatement( $table, $data ) {
		$sql = '';
		if( preg_match('/^[-_a-z0-9]+$/i',$table) && is_array($data) ) {
			$columns = array();
			$values = array();
			$update = array();
			foreach( $data as $column => $value )
				if( preg_match('/^[-_a-z0-9]+$/i',$column) ) {
					array_push($columns,$column);
					array_push($values,$value);
					if( $column!='id' )
						array_push($update,$column.'='.$value);
				}
			$sql = "INSERT INTO ".$table." (".implode(',',$columns).") VALUES (".implode(',',$values).") ON DUPLICATE KEY UPDATE ".implode(',',$update);
		}
		return $sql;
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
	public function __destruct() {
		$this->disconnect();
	}
	
	/**
	 * init
	 *
	 * @return void
	 */
	private function init() {
		$this->queries = array();
		$c = Site::getIniContents('mysql');
		$this->options = array(
			'server' => is_string($c['server']) ? $c['server'] : '',
			'user' => is_string($c['user']) ? $c['user'] : '',
			'password' => is_string($c['password']) ? $c['password'] : '',
			'database' => is_string($c['database']) ? $c['database'] : ''
		);
		$this->connect();
	}
	
	/**
	 * connect
	 *
	 * @return void
	 */
	private function connect() {
		$this->mysqli = @new mysqli( $this->options['server'], $this->options['user'], $this->options['password'], $this->options['database'] );
		if( $this->mysqli->connect_errno ) {
			Site::dieOnError( 'Database::connect() failed; '.$this->mysqli->connect_error );
		}
	}
	
	/**
	 * disconnect
	 *
	 * @return void
	 */
	private function disconnect() {
		@$this->mysqli->close();
	}
	
	/**
	 * esc
	 *
	 * @param string $str
	 * @return string
	 */
	public function esc( $str ) {
		return $this->mysqli->escape_string($str);
	}
	
	/**
	 * strPrep
	 * 
	 * @param string $str
	 * @return string	"null" if $str is empty or no string, otherwise escaped $str enclosed by single quotes
	 */
	public function strPrep( $str ) {
		return !is_string($str) ? 'null' : "'".$this->esc($str)."'";
	}
	
	/**
	 * intPrep
	 * 
	 * @param int $int
	 * @return string	"null" if $int is empty or no integer, otherwise $int enclosed by single quotes
	 */
	public function intPrep( $int ) {
		return !is_int($int) ? 'null' : "'".$int."'";
	}
	
	/**
	 * boolPrep
	 * 
	 * @param bool $bool
	 * @return string	"null" if $bool is no boolean, otherwise "0" or "1" depending on boolean
	 */
	public function boolPrep( $bool ) {
		return !is_bool($bool) ? 'null' : "'".($bool?'1':'0')."'";
	}
	
	/**
	 * query
	 *
	 * @param string $sql	mysql query string
	 * @return mixed		FALSE on failure. For successful SELECT, SHOW, DESCRIBE or EXPLAIN queries Database::query() will return a MySQLi_Result object. For other successful queries mysqli_query() will return TRUE
	 */
	public function query( $sql ) {
		$result = @$this->mysqli->query($sql);
		array_push( $this->queries, array($sql,$result) );
		if( !$result )
			Site::dieOnError( 'Database::query() failed; '.$this->mysqli->error );
		return $result;
	}
	
	/**
	 * multiQuery
	 *
	 * @param string $sql	one or more mysql queries, seperated by semicolon
	 * @return array		results: FALSE on failure. For successful SELECT, SHOW, DESCRIBE or EXPLAIN queries Database::query() will return a MySQLi_Result object. For other successful queries mysqli_query() will return TRUE
	 */
	public function multiQuery( $sql ) {
		$results = array();
		$results[0] = @$this->mysqli->multi_query($sql);
		while( $results[0] && $this->mysqli->next_result() )
			array_push( $results, $this->mysqli->store_result() );
		array_push( $this->queries, array($sql,$results) );
		if( !$results[0] )
			Site::dieOnError( 'Database::multiQuery() failed; '.$this->mysqli->error );
		return $results;
	}
	
	/**
	 * isKeyUsedAsForeignKey
	 *
	 * returns true if the $key from column 'id' in $table is used as foreign key in other tables and there are one or more entries in one or more of this foreign tables with $key from $table in the respective foreign key column
	 * 
	 * @param string $table				table name
	 * @param int $key					entry id
	 * @param string $excludeTables		string or array of strings with foreign table names which will be excluded from the test
	 * @return bool
	 */
	public function isKeyUsedAsForeignKey( $table, $key, $excludeTables=null ) {
		$excludeTables = is_array($excludeTables) ? $excludeTables : ( is_string($excludeTables) ? array($excludeTables) : array() );
		$key = intval($key);
		if( preg_match('/^[-_a-z0-9]+$/i',$table) && $key>0 ) {
			$result = $this->query("SELECT table_name,column_name FROM information_schema.key_column_usage
				WHERE constraint_schema = '".$this->options['database']."'
				AND table_schema = '".$this->options['database']."'
				AND referenced_table_name = '".$table."'");
			$select = array();
			while( $result && $row=$result->fetch_assoc() )
				if( !in_array($row['table_name'],$excludeTables) )
					array_push($select,"(SELECT COUNT(DISTINCT ".$row['column_name'].") FROM ".$row['table_name']." WHERE ".$row['column_name']."='".$key."') AS ".$row['table_name']);
			if( !empty($select) ) {
				$result2 = $this->query("SELECT ".implode(',',$select));
				if( $result2 && $row=$result2->fetch_assoc() ) {
					$sum = 0;
					foreach($row as $count)
						$sum += intval($count);
					return $sum>0 ? true : false;
				}
			}
		}
		return false;
	}
	
	/**
	 * getInsertId
	 *
	 * @return int
	 */
	public function getInsertId() {
		return $this->mysqli->insert_id;
	}
	
	/**
	 * countQueries
	 *
	 * @return int
	 */
	public function countQueries() {
		return count($this->queries);
	}
	
	/**
	 * getQueries
	 *
	 * @return array
	 */
	public function getQueries() {
		return $this->queries;
	}
	
	/**
	 * getError
	 *
	 * @return string
	 */
	public function getError() {
		return $this->mysqli->error;
	}
	
}

?>
