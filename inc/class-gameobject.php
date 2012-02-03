<?php
/**
 * class-gameobject.php
 *
 * @package Anno2070Rechner
 */

/**
 * GameObject
 *
 * @package Anno2070Rechner
 */
class GameObject {

	protected $guid = 0,
		$icon = '',
		$locals = array();

	public function __construct( $guid=null, $icon=null, $locals=null ) {
		$this->setGuid( $guid );
		$this->setIcon( $icon );
		$this->setLocals( $locals );
	}
	
	public function setGuid( $int ) {
		if( $int!==null ) {
			$int = intval($int);
			if( !in_array($int,GameData::getGuidBlacklist()) && $int>0 )
				$this->guid = $int;
		}
	}
	
	public function getGuid() {
		return $this->guid;
	}

	public function setIcon( $str ) {
		$str = (string) $str;
		if( !empty($str) )
			$this->icon = $str;
	}
	
	public function getIcon() {
		return $this->icon;
	}
	
	public function setLocal( $key, $str ) {
		$str = (string) $str;
		if( in_array($key,array('en','de')) && !empty($str) )
			$this->locals[$key] = $str;
	}
	
	public function setLocals( $locals ) {
		if( is_array($locals) )
			foreach($locals as $k => $v )
				$this->setLocal($k,$v);
	}
	
	public function getLocals() {
		return $this->locals;
	}
	
	public function getLocal( $key=null ) {
		return isset($this->locals[$key]) ? $this->locals[$key] : $this->locals[i18n::getShort()];
	}
	
	public function isValid() {
		if( $this->guid>0 && !empty($this->icon) && count($this->locals)==2 )
			return true;
		return false;
	}
	
}

?>
