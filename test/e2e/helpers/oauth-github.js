function login () {
    browser.driver.get('http://localhost:3001');

    browser.driver.findElement(by.css('#wrapper > main > a.btn')).click();

    // We're at GitHub
    var emailInput = browser.driver.findElement(by.id('login_field'));
    emailInput.sendKeys('runnable-doobie');

    var passwordInput = browser.driver.findElement(by.id('password'));
    passwordInput.sendKeys('purple4lyfe');

    var signInButton = browser.driver.findElement(by.css('input[name="commit"]'));
    signInButton.click();

    // We're being redirected
    browser.driver.sleep(1500);

    expect(browser.getTitle()).toBe('Runnable');
}

module.exports = login;