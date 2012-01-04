<?php

$approve = isset($_POST['approve']) ? $_POST['approve'] : ( isset($_GET['approve']) ? $_GET['approve'] : false);

if( $approve ) {

	$data = explode(':',base64_decode($approve));

	$user_id = intval( isset($data[0]) ? $data[0] : 0 );
	$verification_key = isset($data[1]) ? $data[1] : '';
	$new_email = isset($data[2]) ? $data[2] : '';

	$user = User::getById($user_id);

}

if( isset($user) && $user && _::isValidEmail($new_email) && !User::checkEmailExists($new_email) ) && $user->verificationKeyIsValid() && $user->getVerificationKey()==$verification_key ) {

	$errors = array();

	if( strtolower($_SERVER['REQUEST_METHOD'])=='post' ) {

		if( empty($_POST['pwd']) )
			$errors['pwd'] = __('Gib dein Passwort ein');
		elseif( !User::isValidPassword($_POST['pwd']) )
			$errors['pwd'] = __('Ung&uuml;ltiges Passwort');
		elseif( !User::checkLoginPassword($user,$_POST['pwd']) )
			$errors['pwd'] = __('Falsches Passwort');

		if( isset($_POST['live_validate']) ) {
			$json = array(
				'valid' => isset($errors[$_POST['live_validate']]) ? false : true,
				'error' =>isset($errors[$_POST['live_validate']]) ? $errors[$_POST['live_validate']] : ''
			);
			$page->clearContent();
			$page->setType('json');
			$page->addContent($json);
			$site->output();
		}
		else {
			
			$success_msg = false;
					
			if( empty($errors) ) {
				$user->setEmail($new_email);
				$user->unsetVerificationKey();
				$user->save();
				$success_msg = sprintf( __('Deine E-Mailadresse wurde in <em>%s</em> ge&auml;ndert.'), $new_email );
			}
		
			if( isset($_POST['ajax']) && $_POST['ajax']==1 ) {
				$json = array(
					'success' => empty($errors) ? true : false,
					'errors' => $errors,
					'success_msg' => $success_msg
				);
				$page->clearContent();
				$page->setType('json');
				$page->addContent($json);
				$site->output();
			}
		}

	}

	$page->addContent(
		'<h2 class="user">'.__('E-Mailadresse &auml;ndern').'</h2>',
		'<form id="'.$page->getIdSanitized().'-form" action="'.i18n::url($page->getId()).'" method="post">',
			'<fieldset class="blue">'
	);
	if( isset($success_msg) && $success_msg )
		$page->addContent( '<p>'.$success_msg.'</p>' );
	else
		$page->addContent(
				'<input type="hidden" name="approve" value="'.$approve.'" />',
				'<dl>',
					'<dt>',
						'<label>'.__('Benutzername').'</label>',
					'</dt>',
					'<dd>',
						'<input type="text" readonly="readonly" value="'.$user->getLogin().'" />',
					'</dd>',
					'<dt>',
						'<label>'.__('Passwort').'</label>',
					'</dt>',
					'<dd>',
						'<input type="password" class="first-focus'.( isset($_POST['pwd']) ? ( isset($errors['pwd']) ? ' invalid' : ' valid' ) : '' ).'" name="pwd" value="" tabindex="1" placeholder="'.__('mind. 8 Zeichen').'" />',
						'<span class="error">'.( isset($errors['pwd']) ? $errors['pwd'] : '' ).'</span>',
					'</dd>',
					'<dt>',
						'<label>'.__('Neue E-Mail').'</label>',
					'</dt>',
					'<dd>',
						'<input type="text" readonly="readonly" value="'.$new_email.'" />',
					'</dd>',
					'<dd>',
						'<input type="submit" value="'.__('&Auml;ndern').'" tabindex="3" />',
					'</dd>',
				'</dl>'
		);
	$page->addContent(
			'</fieldset>',
		'</form>'
	);

}
else
	$page->addContent(
		'<h2 class="sad">'.__('Oops, da ist etwas total schiefgelaufen&hellip;').'</h2>'
	);

?>
