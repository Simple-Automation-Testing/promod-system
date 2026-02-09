class Button {}
class Input {}

class LoginFormFragment {
  id = 'Login Form';
  username = new Input();
  submitBtn = new Button();
}

class LoginPage {
  id = 'Login';
  loginForm = new LoginFormFragment();
}

function getPage() {
  return new LoginPage();
}

export { getPage };
