<?php
/**
 * class-page.php
 *
 * @package Anno2070Rechner
 */

/**
 * Page
 *
 * @package Anno2070Rechner
 */
class Page {

	private $template_dir = '',
		$id = '',
		$type = '',
		$redirect = '',
		$title = '',
		$templates = array(),
		$content = array(),
		$rights = array(),
		$pagedata = array(),
		$pages = array(),
		$pagegroups = array();
	
	/**
	 * __construct
	 *
	 * @param string $id
	 * @return void
	 */
	public function __construct( $id ) {
		// ID festlegen
		$this->setID($id);
		// absoluter Pfad zu den Template-Dateien
		$this->template_dir = ABSPATH.'tpl/';
		// Seitendaten aus Konfiguration laden
		$this->pages = Site::_()->getPages();
		// Seitengruppendaten aus Konfiguration laden
		$this->pagegroups = Site::_()->getPagegroups();
		// falls angeforderte Seite nicht existiert, aussteigen
		if( !isset($this->pages[$id]) )
			return;
		// Seitendaten für angeforderte Seite festlegen
		$this->pagedata = $this->pages[$id];
		// falls für Eigenschaften, bei welchen mehrere Werte möglich sind, nur ein Wert festgelegt wurde, diesen in ein Array fassen
		foreach( array('tpl','group','right') as $i )
			if( isset($this->pagedata[$i]) && is_string($this->pagedata[$i]) )
				$this->pagedata[$i] = array($this->pagedata[$i]);
		// Seitentyp festlegen
		$this->setType();
		// Redirect-Ziel verarbeiten
		$this->setRedirect();
		// Gruppen verarbeiten
		$this->parseGroups();
		// Titel festlegen
		$this->setTitle();
		// Rechte festlegen
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
		if( isset($id) && preg_match('/^#?[-a-z0-9_\/]+$/i',$id) )
			$this->id = $id;
		// ansonsten DieOnError
		else
			die('ERROR: Invalid page ID in page configuration: "'.$id.'"');
	}
	
	/**
	 * setType
	 *
	 * @param string type
	 * @return void
	 */
	public function setType( $type=null ) {
		if( empty($type) && isset($this->pagedata['type']) )
			$type = $this->pagedata['type'];
		// falls Typ vorhanden und innerhalb erlaubter Parameter, Typ setzen, ansonsten default setzen
		$this->type = !empty($type) && in_array( $type, array('html','json','redirect') ) ? $type : 'html';
	}
	
	/**
	 * setRedirect
	 *
	 * @return void
	 */
	private function setRedirect() {
		// falls Typ 'redirect', redirect target setzen
		if( $this->type == 'redirect' )
			$this->redirect = $this->pagedata['redirect'];
	}
	
	/**
	 * parseGroups
	 *
	 * @return void
	 */
	private function parseGroups() {
		// falls die Seite keine Gruppenzuordnung besitzt, default setzen
		if( !isset($this->pagedata['group']) || !is_array($this->pagedata['group']) )
			// falls default Gruppe nicht existiert, dieOnError
			if( !isset($this->pagegroups[Site::_()->getOption('default_pagegroup')]) )
				die('ERROR: Invalid default pagegroup in site configuration:"'.Site::_()->getOption('default_pagegroup').'"');
			else
				$this->pagedata['group'] = array( Site::_()->getOption('default_pagegroup') );
		// zugeordnete Gruppen durchlaufen
		foreach( $this->pagedata['group'] as $i )
			// falls Gruppe existiert
			if( isset($this->pagegroups[$i]) ) {
				// Gruppe festlegen
				$group = new Pagegroup($i);
				// Gruppendaten in Seitendaten integrieren
				if( !isset($this->pagedata['tpl']) )
					$this->pagedata['tpl'] = array();
				$this->pagedata['tpl'] = array_merge( $group->getTemplatesBefore(), $this->pagedata['tpl'], $group->getTemplatesAfter() );
				if( !isset($this->pagedata['right']) )
					$this->pagedata['right'] = array();
				$this->pagedata['right'] = array_merge( $group->getRights(), $this->pagedata['right'] );
				$this->setType($group->getType());
			}
	}
	
	/**
	 * setTitle
	 *
	 * @return void
	 */
	private function setTitle() {
		// falls ein gültiger Titel vorhanden ist, Titel festlegen
		if( isset($this->pagedata['title_'.i18n::getShort()]) && is_string($this->pagedata['title_'.i18n::getShort()]) && !empty($this->pagedata['title_'.i18n::getShort()]) )
			$this->title = $this->pagedata['title_'.i18n::getShort()];
	}
	
	
	/**
	 * setTemplates
	 *
	 * @return void
	 */
	private function setTemplates() {
		// definierte Templates durchlaufen
		foreach( $this->pagedata['tpl'] as $tpl )
			// falls die Template-Datei existiert, Template hinzufügen
			if( _::isReadableFile($this->template_dir.$tpl.'.php') )
				array_push( $this->templates, $this->template_dir.$tpl.'.php' );
	}

	/**
	 * setRights
	 *
	 * @return void
	 */
	private function setRights() {
		if( isset($this->pagedata['right']) && is_array($this->pagedata['right']) )
			foreach( $this->pagedata['right'] as $i )
				if( is_string($i) && !empty($i) )
					array_push( $this->rights, $i );
	}
	
	/**
	 * addContent
	 * @param mixed
	 * @param mixed
	 * @param ...
	 * @return void
	 */
	public function addContent() {
		// Content hinzufügen
		// beliebig viele Parameter möglich
		// ein Parameter kann ein HTML-String sein oder ein Array mit JSON-Daten oder HTML-Strings
		$_args = func_get_args();
		for( $i=0; $i<func_num_args(); $i++ ) {
			$_arr = is_array($_args[$i]) ? $_args[$i] : array($_args[$i]);
			$this->content = array_merge( $this->content, $_arr );
		}
	}
	
	/**
	 * clearContent
	 * 
	 * @return void
	 */
	public function clearContent() {
		$this->content = array();
	}
	
	/**
	 * getType
	 *
	 * @return string
	 */
	public function getType() {
		return $this->type;
	}
	
	/**
	 * getID
	 *
	 * @return string
	 */
	public function getID() {
		return $this->id;
	}
	
	public function getIdSanitized() {
		return preg_replace('/[#\/]/','_',$this->id);
	}
	
	/**
	 * getRedirect
	 *
	 * @return string
	 */
	public function getRedirect() {
		return $this->redirect;
	}
	
	/**
	 * getTitle
	 *
	 * @return string
	 */
	public function getTitle() {
		return $this->title;
	}
	
	/**
	 * getTemplates
	 *
	 * @return array
	 */
	public function getTemplates() {
		return $this->templates;
	}
	
	/**
	 * getContent
	 *
	 * @return array
	 */
	public function getContent() {
		return $this->content;
	}
	
	/**
	 * getRights
	 *
	 * @return void
	 */
	public function getRights() {
		return $this->rights;
	}
	
}

?>
