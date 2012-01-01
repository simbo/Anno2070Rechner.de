<?php
/**
 * class-building.php
 *
 * @package Anno2070Rechner
 */

/**
 * Building
 *
 * @package Anno2070Rechner
 */
class Building extends GameObject {

	protected $build_costs_credits = 0, 
		$build_costs_products = array(),
		$maintenance_costs = array(
			'active_cost' => 0,			// credits
			'inactive_cost' => 0,		// credits
			'active_eco' => 0,			// eco effect 4096:1
			'inactive_eco' => 0,		// eco effect 4096:1
			'active_energy' => 0,		// energy 4096:1
			'inactive_energy' => 0		// energy 4096:1
		),
		$hitpoints = 0,
		$level = null;
		

	public function __construct( $guid=null, $icon=null, $locals=null, $build_costs_credits=null, $build_costs_products=null, $maintenance_costs=null ) {
		$this->setGuid( $guid );
		$this->setIcon( $icon );
		$this->setLocals( $locals );
		$this->setBuildcostsCredits( $build_costs_credits );
		$this->setBuildcostsProducts( $build_costs_products );
		$this->setMaintenanceCosts( $maintenance_costs );
	}

	public function setBuildcostsCredits( $int ) {
		if( $int!==null ) {
			$int = intval( $int );
			if( $int>0 )
				$this->build_costs_credits = $int;
		}
	}
	
	public function getBuildcostsCredits() {
		return $this->build_costs_credits;
	}
	
	public function setBuildcostsProduct( $obj, $int ) {
		if( $int!==null ) {
			$int = intval( $int );
			if( is_a($obj,'GameObject') && $int>0 )
				$this->build_costs_products[ $obj->getGuid() ] = array($obj,$int);
		}
	}
	
	public function getBuildcostsProduct( $objOrGuid ) {
		$guid = is_a($objOrGuid,'GameObject') ? $objOrGuid->getGuid() : intval($objOrGuid);
		return isset($this->build_costs_products[$guid]) ? $this->build_costs_products[$guid][1] : 0;
	}
	
	public function setBuildcostsProducts( $arr ) {
		if( is_array($arr) )
			foreach($arr as $k => $v )
				$this->setBuildcostsProduct($k,$v);
	}
	
	public function getBuildcostsProducts() {
		return $this->build_costs_products;
	}
	
	public function setMaintenanceCost( $key, $int ) {
		if( $int!==null ) {
			$int = intval( $int );
			if( isset($this->maintenance_costs[$key]) )
				$this->maintenance_costs[$key] = $int;
		}
	}

	public function setMaintenanceCosts( $arr ) {
		if( is_array($arr) )
			foreach($arr as $k => $v )
				$this->setMaintenanceCost($k,$v);
	}
	
	public function getMaintenanceCost( $key ) {
		return isset($this->maintenance_costs[$key]) ? $this->maintenance_costs[$key] : 0;
	}
	
	public function getMaintenanceCosts() {
		return $this->maintenance_costs;
	}
	public function setHitpoints( $int ) {
		if( $int!==null )
			$this->hitpoints = intval( $int );
	}
	
	public function getHitpoints() {
		return $this->hitpoints;
	}
	
	public function setLevel( $str ) {
		$str = (string) $str;
		if( !empty($str) )
			$this->level = $str;
	}
	
	public function getLevel() {
		return $this->level!==null ? $this->level : '';
	}
	
}

?>
