<?php
/**
 * class-residencebuilding.php
 *
 * @package Anno2070Rechner
 */

/**
 * ResidenceBuilding
 *
 * @package Anno2070Rechner
 */
class ResidenceBuilding extends Building {

	protected $min_residents = 1,
		$max_residents = 1;

	public function __construct( $guid=null, $icon=null, $locals=null, $build_costs_credits=null, $build_costs_products=null, $maintenance_costs=null, $min_residents=null, $max_residents=null ) {
		$this->setGuid( $guid );
		$this->setIcon( $icon );
		$this->setLocals( $locals );
		$this->setBuildCostsCredits( $build_costs_credits );
		$this->setBuildCostsProducts( $build_costs_products );
		$this->setMaintenanceCosts( $maintenance_costs );
		$this->setMinResidents( $min_residents );
		$this->setMaxResidents( $max_residents );
	}

	public function setMinResidents( $int ) {
		if( $int!==null )
			$this->min_residents = intval( $int );
	}
	
	public function getMinResidents() {
		return $this->min_residents;
	}
	
	public function setMaxResidents( $int ) {
		if( $int!==null )
			$this->max_residents = intval( $int );
	}
	
	public function getMaxResidents() {
		return $this->max_residents;
	}
	
	public function isValid() {
		if( parent::isValid() && $this->min_residents<=$this->max_residents )
			return true;
		return false;
	}

}

?>
