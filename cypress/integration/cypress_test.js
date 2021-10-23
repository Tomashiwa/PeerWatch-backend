describe("cypress test", () => {
	it("landing page has all expected elements", () => {
		cy.visit("http://localhost:3000");
		// cy.contains("Home");
		// cy.contains("Room");
		// cy.contains("PeerWatch");
	});

	it("room has all expected elements", () => {
		cy.visit("http://localhost:3000");
		// cy.contains("Room").click();
		// cy.contains("Home");
		// cy.contains("Room");
		// cy.contains("PeerWatch");
		// cy.contains("Watchmates (1)");
		// cy.contains("Submit");
		// cy.contains("Room settings");
	});

	it("room expected interactions", () => {
		cy.visit("http://localhost:3000");
		// cy.contains("Room").click();
		// cy.get('[data-cy=chat-input]').type("lol")
		// cy.contains("Submit").click();
		// cy.contains("lol");
	});
});
