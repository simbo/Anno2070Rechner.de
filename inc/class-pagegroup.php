<?php
/**
 * class-pagegroup.php
 *
 * @package Anno2070Rechner
 */

/**
 * Pagegroup
 *
 * @package Anno2070Rechner
 */
class Pagegroup {

	private $id = '',
		$templates_before = array(),
		$templates_after = array(),
		$rights = array(),
		$groupdata = array(),
		$pagegroups = array(),
		$type = '';
	
	/**
	 * __construct
	 *
	 * @param unknown $id
	 * @return void
	 */
	public function __construct( $id ) {
		// ID festlegen
		$this->setID($id);
		// Gruppendaten aus Konfiguration laden
		$this->pagegroups = Site::_()->getPagegroups();
		// falls angeforderte Gruppe nicht existiert, aussteigen
		if( !isset($this->pagegroups[$id]) )
			return;
		// Gruppendaten für angeforderte Gruppe festlegen
		$this->groupdata = $this->pagegroups[$id];
		// falls für Eigenschaften, bei welchen mehrere Werte möglich sind, nur ein Wert festgelegt wurde, diesen in ein Array fassen
		foreach( array('tpl_before','tpl_after','right') as $i )
			if( !isset($this->groupdata[$i]) )
				$this->groupdata[$i] = array();
			elseif( is_string($this->groupdata[$i]) )
				$this->groupdata[$i] = array($this->groupdata[$i]);
		$this->type = isset($this->groupdata['type']) ? $this->groupdata['type'] : null;
		// Elterngruppe verarbeiten
		$this->parseParent();
		// Rechte setzen festlegen
		$this->setRights();
		// Templates festlegen
		$this->setTemplates();
	}
	
	/**
	 * setID
	 *
	 * @param unknown $id
	 * @return void
	 */
	private function setID( $id ) {
		// falls ID den Anforderungen entspricht (URL-Part), ID setzen
		if( isset($id) && preg_match('/^[-_a-z0-9]+$/i',$id) )
			$this->id = $id;
		// ansonsten DieOnError
		else
			die('ERROR: Invalid group ID in pagegroup configuration: "'.$id.'"');
	}
	
	/**
	 * parseParent
	 *
	 * @return void
	 */
	private function parseParent() {
		// falls die Gruppe eine Elterngruppe besitzt und diese Gruppe existiert
		if( isset($this->groupdata['parent']) && isset($this->pagegroups[$this->groupdata['parent']]) ) {
			// Elterngruppe setzen
			$group = new Pagegroup($this->groupdata['parent']);
			// Daten der Elterngruppe in die Gruppendaten integrieren
			if( $group->getType()!=null )
				$this->type = $group->getType();
			if( !isset($this->groupdata['tpl_before']) )
				$this->groupdata['tpl_before'] = array();
			$this->groupdata['tpl_before'] = array_merge( $group->getTemplatesBefore(), $this->groupdata['tpl_before'] );
			if( !isset($this->groupdata['tpl_after']) )
				$this->groupdata['tpl_after'] = array();
			$this->groupdata['tpl_after'] = array_merge( $this->groupdata['tpl_after'], $group->getTemplatesAfter() );
			if( !isset($this->groupdata['right']) )
				$this->groupdata['right'] = array();
			$this->groupdata['right'] = array_merge( $group->getRights(), $this->groupdata['right'] );
		}
	}
	
	/**
	 * setRights
	 *
	 * @return void
	 */
	private function setRights() {
		if( isset($this->groupdata['right']) && is_array($this->groupdata['right']) )
			foreach( $this->groupdata['right'] as $i )
				if( is_string($i) && !empty($i) )
					array_push( $this->rights, $i );
	}
	
	/**
	 * setTemplates
	 *
	 * @return void
	 */
	private function setTemplates() {
		// definierte Templates durchlaufen und hinzufügen
		foreach( $this->groupdata['tpl_before'] as $tpl )
			array_push( $this->templates_before, $tpl );
		foreach( $this->groupdata['tpl_after'] as $tpl )
			array_push( $this->templates_after, $tpl );
	}

	/**
	 * getID
	 *
	 * @return string
	 */
	public function getID() {
		return $this->id;
	}
	
	/**
	 * getTemplatesBefore
	 *
	 * @return array
	 */
	public function getTemplatesBefore() {
		return $this->templates_before;
	}
	
	/**
	 * getTemplatesAfter
	 *
	 * @return array
	 */
	public function getTemplatesAfter() {
		return $this->templates_after;
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
	 * getType
	 *
	 * @return string
	 */
	public function getType() {
		return $this->type;
	}
	
}

?>
