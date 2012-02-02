<?php
/**
 * class-productionbuilding.php
 *
 * @package Anno2070Rechner
 */

/**
 * ProductionBuilding
 *
 * @package Anno2070Rechner
 */
class ProductionBuilding extends Building {

	protected static $types = array(
		'farm',
		'factory',
		'eco',
		'energy',
		'forest'
	);

	protected $type = 0,
		$product = null,
		$production_time = 20000,	// milliseconds
		$production_count = 1000,	// kilograms
		$raw1 = null,
		$raw1_need = 1000,			// kilograms
		$raw2 = null,
		$raw2_need = 1000;			// kilograms

	public function __construct( $guid=null, $icon=null, $locals=null, $build_costs_credits=null, $build_costs_products=null, $maintenance_costs=null, $type=null, $product=null, $production_time=null, $production_count=null, $raw1=null, $raw1_need=null, $raw2=null, $raw2_need=null ) {
		$this->setGuid( $guid );
		$this->setIcon( $icon );
		$this->setLocals( $locals );
		$this->setBuildCostsCredits( $build_costs_credits );
		$this->setBuildCostsProducts( $build_costs_products );
		$this->setMaintenanceCosts( $maintenance_costs );
		$this->setType( $type );
		$this->setProduct( $product, $production_time, $production_count );
		$this->setRaw1( $raw1, $raw1_need );
		$this->setRaw2( $raw2, $raw2_need );
	}

	public function setType( $type ) {
		if( is_string($type) && in_array($type,self::$types) )
			$type = array_search($type,self::$types);
		if( is_int($type) && $type>=0 && $type<count(self::$types) )
			$this->type = $type;
	}
	
	public function getType() {
		return $this->type;
	}
	
	public function isFarm() {
		return $this->type === 0 ? true : false;
	}
	
	public function isFactory() {
		return $this->type === 1 ? true : false;
	}
	
	public function isEco() {
		return $this->type === 2 ? true : false;
	}
	
	public function isEnergy() {
		return $this->type === 3 ? true : false;
	}
	
	public function isForest() {
		return $this->type === 4 ? true : false;
	}
	
	public function setProduct( $obj, $time=null, $count=null ) {
		if( is_a($obj,'GameObject') ) {
			$this->product = $obj;
			$this->setProductionTime( $time );
			$this->setProductionCount( $count );
		}
	}
	
	public function getProduct() {
		return $this->product;
	}
	
	public function setProductionTime( $int ) {
		if( $int!==null ) {
			$int = intval($int);
			if( !empty($this->product) && $int>0 )
				$this->production_time = $int;
		}
	}
	
	public function getProductionTime() {
		return $this->production_time;
	}
	
	public function setProductionCount( $int ) {
		if( $int!==null ) {
			$int = intval($int);
			if( !empty($this->product) && $int>0 )
				$this->production_count = $int;
		}
	}
	
	public function getProductionCount() {
		return $this->production_count;
	}
	
	public function setRaw1( $obj, $need=null ) {
		if( is_a($obj,'GameObject') ) {
			$this->raw1 = $obj;
			$this->setRaw1Need( $need );
		}
	}
	
	public function getRaw1() {
		return $this->raw1;
	}
	
	public function setRaw1Need( $int ) {
		if( $int!==null ) {
			$int = intval($int);
			if( !empty($this->raw1) && $int>0 )
				$this->raw1_need = $int;
		}
	}
	
	public function getRaw1Need() {
		return !empty($this->raw1) ? $this->raw1_need : null;
	}
	
	public function setRaw2( $obj, $need=null ) {
		if( is_a($obj,'GameObject') ) {
			$this->raw2 = $obj;
			$this->setRaw2Need( $need );
		}
	}
	
	public function getRaw2() {
		return $this->raw2;
	}
	
	public function setRaw2Need( $int ) {
		if( $int!==null ) {
			$int = intval($int);
			if( !empty($this->raw2) && $int>0 )
				$this->raw2_need = $int;
		}
	}
	
	public function getRaw2Need() {
		return !empty($this->raw2) ? $this->raw2_need : null;
	}
	
	public function isValid() {
		if( parent::isValid()
			&& !empty($this->product) 
			&& (
				( $this->isFarm() && ( $this->raw1===null && $this->raw2===null ) )
				|| ( $this->isFactory() && ( is_a($this->raw1,'GameObject') || is_a($this->raw2,'GameObject') ) )
				|| $this->getType()>1
			)
		)
			return true;
		return false;
	}
	
	public function getProductionTicksPerMinute() {
		return 60000 / $this->production_time;
	}
	
	public function getProductionTonsPerMinute() {
		if( $this->isEnergy() )
			return $this->getMaintenanceCost('active_energy')/4096*-1;
		elseif( $this->isEco() )
			return $this->getMaintenanceCost('active_eco')/4096;
		else
			return ($this->production_count / 1000) * $this->getProductionTicksPerMinute();
	}
	
	public function getRaw1NeedTonsPerMinute() {
		return ($this->raw1_need / 1000) * $this->getProductionTicksPerMinute();
	}
	
	public function getRaw2NeedTonsPerMinute() {
		return ($this->raw2_need / 1000) * $this->getProductionTicksPerMinute();
	}
	
}

?>
