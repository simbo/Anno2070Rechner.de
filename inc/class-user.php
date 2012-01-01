<?php
/**
 * class-user.php
 *
 * @package Anno2070Rechner
 */

/**
 * User
 *
 * @package Anno2070Rechner
 * @final
 */
final class User {
		
	const minPasswordLength = 8,		// int		minimum password length
		blowfishCost = 12; 				// int		cost parameter for blowfish salt, between 4 and 31

	private static $allRights = array(	// array	all available rights
			'admin'
		);

	private $id = 0,		// int		not null, ai
		$login,				// string
		$email,				// string
		$password_hash,		// string	password blowfish hash
		$rights=array(),	// array	array of permitted rights
		$active=false,
		$verification_key=null,
		$verification_time=0,
		$time_last_auth = 0,
		$time_registered = 0;
	

	/**
	 * getAvailableRights
	 * 
	 * returns array of all available rights
	 *
	 * @static
	 * @return array
	 */
	public static function getAvailableRights() {
		return self::$allRights;
	}

	/**
	 * cookieAuth
	 *
	 * auth with login cookie
	 *
	 * @static
	 * @return void
	 */
	public static function cookieAuth() {
		$cookie = self::getLoginCookie();
		if( $cookie	&& $user=self::getById($cookie['id'])	) {
			if( $user->isActive() && self::checkHash( $user->getLogin().$user->getPasswordHash(), $cookie['hash'] ) )
				$user->auth();
			else
				self::deleteLoginCookie();
		}
	}
	
	/**
	 * deleteLoginCookie
	 *
	 * try to delete a login cookie
	 *
	 * @static
	 * @return void
	 */
	public static function deleteLoginCookie() {
		_::unsetCookie('login');
	}
	
	/**
	 * checkHash
	 * 
	 * test a hash on a string
	 *
	 * @static
	 * @param string $str
	 * @param string $hash
	 * @return bool
	 */
	public static function checkHash( $str, $hash ) {
		return self::hash($str,substr($hash,0,29).'$')==$hash ? true : false;
	}
	
	/**
	 * hash
	 * 
	 * return blowfish hash of a string
	 *
	 * @static
	 * @param string $str
	 * @param string $salt=''		will be generated automatically if empty
	 * @return string
	 */
	public static function hash( $str, $salt='' ) {
		if( !preg_match('/^\$2a\$[0-9]{2}\$[a-zA-Z0-9\/\.]{22}\$$/',$salt) )
			$salt = self::generateSalt();
		if( !defined('CRYPT_BLOWFISH') )
			Site::dieOnError('User::hashString() failed; CRYPT_BLOWFISH not available');
		return crypt( $str, $salt );
	}
	
	/**
	 * generateSalt
	 * 
	 * generate a salt for blowfish encryption
	 *
	 * @static
	 * @return string
	 */
	public static function generateSalt() {
		$salt = '$2a$';	// prefix
		$salt .= sprintf('%02d',min(31,max(intval(self::blowfishCost),4))).'$';	// cost
		$salt .= _::generateRandomString(22,7,'./'); // 22 random chars
		return $salt.'$';
	}

	/**
	 * logout
	 * 
	 * unsets the User registered in the session, destroys and restarts the session
	 *
	 * @static
	 * @return void
	 */
	public static function logout() {
		$_SESSION['user'] = null;
		self::deleteLoginCookie();
		Session::restart();
		return isset($_SESSION['user']) ? false : true;
	}
	
	/**
	 * isLoggedIn
	 * 
	 * tests if a User is registered in the Session
	 *
	 * @static
	 * @return void
	 */
	public static function isLoggedIn() {
		return isset($_SESSION['user']) && $_SESSION['user'] instanceof User ? true : false;
	}
	
	/**
	 * getCurrent
	 * 
	 * returns the currently logged in User
	 *
	 * @static
	 * @return User
	 */
	public static function getCurrent() {
		return self::isLoggedIn() ? $_SESSION['user'] : null;
	}
	
	/**
	 * _
	 * 
	 * alias for User::getCurrent()
	 *
	 * @see User::getCurrent()
	 */
	public static function _() {
		return self::getCurrent();
	}

	/**
	 * checkLoginExists
	 *
	 * test if a login exists
	 * 
	 * @static
	 * @param string $login
	 * @param int $excludeId=0	excluded from test
	 * @return boolean
	 */
	public static function checkLoginExists( $login, $excludeId=0 ) {
		$excludeId = intval($excludeId);
		$and = $excludeId>0 ? " AND id!=".Database::_()->intPrep($excludeId) : '';
		$sql = "SELECT id FROM users WHERE login LIKE ".Database::_()->strPrep($login).$and;
		$result = Database::_()->query($sql);
		if( $result->num_rows>0 )
			return true;
		return false;
	}

	/**
	 * checkEmailExists
	 *
	 * @static
	 * @param string $email
	 * @param int $excludeId=0	excluded from test
	 * @return boolean
	 */
	public static function checkEmailExists( $email, $excludeId=0 ) {
		$excludeId = intval($excludeId);
		$and = $excludeId>0 ? " AND id!=".Database::_()->intPrep($excludeId) : '';
		$sql = "SELECT id FROM users WHERE email = ".Database::_()->strPrep($email).$and;
		$result = Database::_()->query($sql);
		if( $result && $result->num_rows>0 )
			return true;
		return false;
	}

	/**
	 * isValidLogin
	 * 
	 * @static
	 * @param login $login
	 * @return bool
	 */
	public static function isValidLogin( $login ) {
		$pattern = '/^[a-z]{1}[-_a-z0-9]{2,254}$/i';	// start with letter, between 3 and 255 characters (letters, numbers, underscore, minus)
		return preg_match($pattern,$login) ? true : false;
	}

	/**
	 * isValidPassword
	 *
	 * @static
	 * @param string $password
	 * @return bool
	 */
	public static function isValidPassword( $password ) {
		return is_string($password) && strlen($password)>=self::minPasswordLength ? true : false;
	}
	
	/**
	 * checkLoginPassword
	 * 
	 * tests if password matches login
	 *
	 * @static
	 * @param mixed $loginOrUser
	 * @param string $password
	 * @return bool
	 */
	public static function checkLoginPassword( $loginOrUser, $password ) {
		$user = is_a($loginOrUser,'User') ? $loginOrUser : self::getByLogin($loginOrUser);
		return ( $user && self::checkHash($password,$user->getPasswordHash()) ) ? true : false;
	}
	
	/**
	 * getLoginCookie
	 *
	 * returns a login cookie if present otherwise false
	 *
	 * @return array
	 */
	private static function getLoginCookie() {
		if( isset($_COOKIE['login']) ) {
			$cookie = @unserialize($_COOKIE['login']);
			if( isset($cookie['id'])
				&& is_int($cookie['id'])
				&& isset($cookie['hash'])
				&& is_string($cookie['hash'])
			)
				return $cookie;
		}
		return false;
	}
	
	/**
	 * getByID
	 * 
	 * returns a User by id
	 *
	 * @static
	 * @param int $id
	 * @return Person child object
	 */
	public static function getById( $id ) {
		$sql = "SELECT * FROM users WHERE id = ".Database::_()->intPrep($id);
		$result = Database::_()->query($sql);
		if( $result && $row=$result->fetch_array() )
			return self::constructFromRow($row);
		else
			return null;
	}
	
	/**
	 * getByLogin
	 * 
	 * returns a User by login
	 *
	 * @static
	 * @param string $login
	 * @return void
	 */
	public static function getByLogin( $login ) {
		if( !self::isValidLogin($login) )
			return null;
		$sql = "SELECT * FROM users WHERE login LIKE ".Database::_()->strPrep($login);
		$result = Database::_()->query($sql);
		if( $result && $row=$result->fetch_array() )
			return self::constructFromRow($row);
		else
			return null;
	}
	
	/**
	 * getByEmail
	 * 
	 * returns a User by email
	 *
	 * @static
	 * @param string $email
	 * @return void
	 */
	public static function getByEmail( $email ) {
		if( !_::isValidEmail($email) )
			return null;
		$sql = "SELECT * FROM users WHERE email = ".Database::_()->strPrep($email);
		$result = Database::_()->query($sql);
		if( $result && $row=$result->fetch_array() )
			return self::constructFromRow($row);
		else
			return null;
	}
	
	/**
	 * getUsers
	 * 
	 * @static
	 * @param string filters=''		filter options to extend the select statement with WHERE and/or ORDER BYE; see Helper::parseParams() and Helper::getTableFilters() for details
	 * @return array
	 */
	public static function getUsers( $filters='' ) {
		$filters = _::getTableFilters( _::parseParams($filters) );
		$sql = "SELECT * FROM users".$filters['sql_append'];
		$objects = array();
		$result = Database::_()->query($sql);
		while( $result && $row=$result->fetch_assoc() ) {
			$object = self::constructFromRow($row);
			$objects[$object->getId()] = $object;
		}
		return $objects;
	}

	/**
	 * getUsersByRight
	 *
	 * returns all Users who have the $right
	 * 
	 * @static
	 * @param string $right
	 * @return array
	 */
	private static function getByRight( $right ) {
		$objects = array();
		if( in_array($right,self::$allRights) ) {
			$sql = "SELECT u.* FROM users AS u, user_has_right AS r WHERE r.right_key = ".Database::_()->strPrep($right)." AND u.id = r.users_id";
			$result = Database::_()->query($sql);
			while( $result && $row=$result->fetch_assoc() ) {
				$object = self::constructFromRow($row);
				$objects[$object->id] = $object;
			}
		}
		return $objects;
	}

	/**
	 * create
	 * 
	 * creates and saves a new User
	 *
	 * @static
	 * @param string $login
	 * @param string $password
	 * @param string $email
	 * @return User
	 */
	public static function create( $login, $password, $email ) {
		if( !self::isValidLogin($login) || !self::isValidPassword($password) || !_::isValidEmail($email) || self::checkLoginExists($login) || self::checkEmailExists($email) )
			return null;
		$password_hash = self::hash($password);
		$object = new self( 0, $login, $password_hash, $email, Timestamp::utc() );
		$object->deactivate();
		return $object->save() ? $object : null;
	}

	/**
	 * constructFromRow
	 * 
	 * creates a User from a mysqli row data array
	 *
	 * @static
	 * @param array $row
	 * @return Person
	 */
	private static function constructFromRow( $data ) {
		if(is_array($data)) {
			$object = new self(
				intval($data['id']),
				$data['login'],
				$data['password_hash'],
				$data['email'],
				intval($data['time_registered']),
				intval($data['time_last_auth']),
				$data['active'] ? true : false,
				empty($data['verification_key']) ? null : $data['verification_key'],
				intval($data['verification_time'])
			);
			return $object;
		}
		return null;
	}

	/**
	 * __construct
	 *
	 * @param int $id
	 * @param string $login
	 * @param string $password_hash
	 * @param string $email
	 * @param int $time_registered
	 * @param int $time_last_auth
	 * @param bool $active=false
	 * @param string $verification_key=null
	 * @param int $verification_time=0
	 * @return void
	 */
	private function __construct( $id, $login, $password_hash, $email, $time_registered, $time_last_auth=0, $active=false, $verification_key=null, $verification_time=0 ) {
		$this->id = $id;
		$this->login = $login;
		$this->email = $email;
		$this->password_hash = $password_hash;
		$this->time_registered = $time_registered;
		$this->time_last_auth = $time_last_auth;
		$this->active = $active;
		$this->verification_key = $verification_key;
		$this->verification_time = $verification_time;
		$this->setRights();
	}
	
	/**
	 * save
	 *
	 * @return bool
	 */
	public function save() {
		$sql = Database::buildInsertUpdateStatement('users', array(
				'id' => Database::_()->intPrep($this->id),
				'login' => Database::_()->strPrep($this->login),
				'email' => Database::_()->strPrep($this->email),
				'password_hash' => Database::_()->strPrep($this->password_hash),
				'time_registered' => Database::_()->intPrep($this->time_registered),
				'time_last_auth' => Database::_()->intPrep($this->time_last_auth),
				'active' => Database::_()->boolPrep($this->active),
				'verification_key' => Database::_()->strPrep($this->verification_key),
				'verification_time' => Database::_()->intPrep($this->verification_time)
			) ).";
			DELETE FROM user_has_right WHERE users_id = ".Database::_()->intPrep($this->id);
		$rights = array();
		foreach( $this->rights as $r )
			array_push($rights,'('.Database::_()->intPrep($this->id).','.Database::_()->strPrep($r).')');
		if( !empty($rights) )
			$sql .= "; REPLACE INTO user_has_right (users_id,right_key) VALUES ".implode(',',$rights);
		if( $result = Database::_()->multiQuery($sql) ) {
			if( $this->id==0 ) {
				$result = Database::_()->query("SELECT MAX(id) FROM users");
				$row = $result->fetch_row();
				$this->id = intval($row[0]);
			}
			if( self::isLoggedIn() && self::_()->getId()==$this->id )
				$_SESSION['user'] = $this;
			return true;
		}
		return false;
	}
	
	/**
	 * delete
	 *
	 * @return bool
	 */
	public function delete() {
		if( !$this->isUsedAsForeignKey() ) {
			$sql = "DELETE FROM users WHERE id = ".Database::_()->intPrep($this->id);
			$result = Database::_()->query($sql);
			return $result ? true : false;
		}
		return false;
	}
	
	/**
	 * setRights
	 * 
	 * sets User rights from table user_has_rights
	 *
	 * @return void
	 */
	private function setRights() {
		$sql = "SELECT right_key FROM user_has_right WHERE users_id = ".Database::_()->intPrep($this->getId());
		$result = Database::_()->query($sql);
		while( $result && $row=$result->fetch_assoc() ) {
			$right = $row['right_key'];
			$right = $right=='login' ? null : $right;
			if( in_array($right,self::$allRights) && !in_array($right,$this->rights) )
				array_push($this->rights,$right);
		}
	}
	
	/**
	 * isUsedAsForeignKey
	 *
	 * @return bool
	 */
	public function isUsedAsForeignKey() {
		return Database::_()->isKeyUsedAsForeignKey('users',$this->id,'user_has_right');
	}
	
	/**
	 * getId
	 *
	 * @return int
	 */
	public function getId() {
		return $this->id;
	}
	
	/**
	 * setLogin
	 *
	 * @param string $login
	 * @return void
	 */
	public function setLogin( $login ) {
		if( $this->isValidLogin($login) && !self::checkLoginExists($login,$this->id) )
			$this->login = $login;
	}
	
	/**
	 * getLogin
	 *
	 * @return string
	 */
	public function getLogin() {
		return empty($this->login) ? '' : $this->login;
	}
	
	/**
	 * setPassword
	 *
	 * @param string $password
	 * @return void
	 */
	public function setPassword( $password ) {
		if( $this->isValidPassword($password) )
			$this->password_hash = $this->hash($password);
	}
	
	/**
	 * getPasswordHash
	 *
	 * @return string
	 */
	public function getPasswordHash() {
		return empty($this->password_hash) ? '' : $this->password_hash;
	}
	
	/**
	 * setEmail
	 *
	 * @param string $str	must be a valid email
	 * @return void
	 */
	public function setEmail( $str ) {
		$str = trim($str);
		if( _::isValidEmail($str) && !self::checkEmailExists($str,$this->id) )
			$this->email = $str;
	}
	
	/**
	 * getEmail
	 *
	 * @return string
	 */
	public function getEmail() {
		return empty($this->email) ? '' : $this->email;
	}
	
	/**
	 * getTimeRegistered
	 *
	 * @return int
	 */
	public function getTimeRegistered() {
		return Timestamp::toLocal($this->time_registered);
	}
	
	/**
	 * getTimeLastAuth
	 *
	 * @return int
	 */
	public function getTimeLastAuth() {
		return Timestamp::toLocal($this->time_last_auth);
	}
	
	/**
	 * activate
	 *
	 * @return void
	 */
	public function activate() {
		$this->active = true;
		$this->unsetVerificationKey();
	}
	
	/**
	 * deactivate
	 *
	 * @return void
	 */
	public function deactivate() {
		$this->active = false;
		$this->setVerificationKey();
	}
	
	/**
	 * isActive
	 *
	 * @return bool
	 */
	public function isActive() {
		return $this->active;
	}
	
	/**
	 * setVerificationKey
	 *
	 * @return void
	 */
	public function setVerificationKey() {
		$this->verification_key = _::generateRandomString(12,3);
		$this->verification_time = Timestamp::utc();
	}
	
	/**
	 * unsetVerificationKey
	 *
	 * @return void
	 */
	public function unsetVerificationKey() {
		$this->verification_key = null;
		$this->verification_time = 0;
	}
	
	/**
	 * getVerificationKey
	 *
	 * @return void
	 */
	public function getVerificationKey() {
		return empty($this->verification_key) ? '' : $this->verification_key;
	}
	
	/**
	 * verificationKeyIsValid
	 *
	 * @return bool
	 */
	public function verificationKeyIsValid() {
		if( !empty($this->verification_key) && $this->verification_time > Timestamp::utc()-604800 )
			return true;
		else {
			$this->unsetVerificationKey();
			return false;
		}
	}
	
	/**
	 * addRight
	 * 
	 * add a right to a User
	 * As you can test if a user is logged in by User::_()->hasRight('login')
	 * to demand user login in page/pagegroups configuration, every user has the
	 * right "login". Therefor the string "login" can neither be added to the
	 * array of right keys nor the corresponding database table.
	 *
	 * @param string $right
	 * @return void
	 */
	public function addRight( $right ) {
		$right = $right=='login' ? null : $right;
		if( in_array($right,parent::getAvailableRights()) && !in_array($right,$this->rights) )
			array_push($this->rights,$right);
	}
	
	/**
	 * addRights
	 *
	 * @param array $rights
	 * @return void
	 */
	public function addRights( $rights ) {
		if( is_array($rights) )
			foreach( $rights as $right )
				$this->addRight($right);
	}
	
	/**
	 * removeRight
	 * 
	 * remove a right from a User
	 *
	 * @param string $right
	 * @return void
	 */
	public function removeRight( $right ) {
		$i = array_search($right,$this->rights);
		if( $i!==false )
			unset($this->rights[$i]);
	}
	
	/**
	 * removeAllRights
	 * 
	 * remove all rights from a User
	 *
	 * @return void
	 */
	public function removeAllRights() {
		$this->rights = array();
	}
	
	/**
	 * addAllRights
	 * 
	 * grant all rights to a User
	 *
	 * @return void
	 */
	public function addAllRights() {
		$this->rights = parent::getAvailableRights();
	}
	
	/**
	 * getRights
	 *
	 * @return array
	 */
	public function getRights() {
		return $this->rights;
	}

	/**
	 * hasRight
	 * 
	 * tests if User has a right
	 *
	 * @param string $right
	 * @return bool
	 */
	public function hasRight( $right ) {
		return $this->active && ( $right=='login' || in_array($right,$this->rights) ) ? true : false;
	}
	
	/**
	 * hasRights
	 *
	 * tests if User has all of the rights in an array
	 * 
	 * @param array $arrRights
	 * @return bool
	 */
	public function hasRights( $arrRights ) {
		$hasRights = true;
		foreach( $arrRights as $right )
			if( !$this->hasRight($right) ) {
				$hasRights = false;
				break;
			}
		return $hasRights;
	}

	/**
	 * auth
	 * 
	 * sets User in the session
	 *
	 * @return bool
	 */
	public function auth() {
		if( $this->active ) {
			$_SESSION['user'] = $this;
			$this->time_last_auth = Timestamp::utc();
			$sql = "UPDATE users SET time_last_auth=".Database::_()->intPrep( $this->time_last_auth )." WHERE id=".Database::_()->intPrep($this->id);
			Database::_()->query($sql);
			if( self::getLoginCookie() )
				self::_()->setLoginCookie(true);
		}
		return self::isLoggedIn();
	}
	
	/**
	 * checkPassword
	 *
	 * @param string $password
	 * @return bool
	 */
	public function checkPassword( $password ) {
		return self::checkHash( $password, $this->password_hash );
	}
	
	/**
	 * getLoginCookieHash
	 *
	 * @param string $salt=''
	 * @return string
	 */
	private function getLoginCookieHash( $salt='' ) {
		return self::hash( $this->login.$this->password_hash, $salt );
	}
	
	/**
	 * setLoginCookie
	 *
	 * set or update login cookie
	 *
	 * @param bool $update=false
	 * @return bool
	 */
	public function setLoginCookie( $update=false ) {
		$cookie = $update && self::getLoginCookie() ? $_COOKIE['login'] : serialize( array(
			'id' => $this->id,
			'hash' => $this->getLoginCookieHash()
		) );
		return _::setCookie( 'login', $cookie, 30 ) ? true : false;
	}

}

?>
