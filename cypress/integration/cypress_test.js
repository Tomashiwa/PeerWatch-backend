describe("cypress test", () => {
	it("visit test", () => {
		cy.visit("http://example.cypress.io")
	})

	it("contain smt", () => {
		cy.visit("http://example.cypress.io")
		cy.contains("type")
	})

	it("click on smt", () => {
		cy.visit("http://example.cypress.io")
		cy.contains("type").click()
	})

	it ("url should contain", () => {
		cy.visit("http://example.cypress.io")
		cy.contains("type").click()
		cy.url().should("include", "/commands/actions")
	})

	it("get input, type and verify", () => {
		cy.visit("http://example.cypress.io")
		cy.contains("type").click()
		cy.get(".action-email").type("fake@email.com").should("have.value", "fake@email.com")
	})
})
