"use client";

import { useState } from "react";
import { useContacts, useAddContact, useRemoveContact, useCurrentUser } from "@/lib/hooks";
import Header from "@/app/components/ui/Header";
import type { Contact } from "@/lib/types";

export default function ContactsPage() {
  const { data: contacts, isLoading, error } = useContacts();
  const { mutate: addContact, isPending: isAdding } = useAddContact();
  const { mutate: removeContact } = useRemoveContact();
  const { data: user } = useCurrentUser();

  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    walletAddress: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.walletAddress) {
      setErrorMessage("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (!formData.walletAddress.startsWith("0x") || formData.walletAddress.length !== 42) {
      setErrorMessage("Please enter a valid wallet address (must start with 0x and be 42 characters)");
      return;
    }

    const contactData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      walletAddress: formData.walletAddress,
      ...(formData.phoneNumber && { phoneNumber: formData.phoneNumber }),
    };

    addContact(contactData, {
      onSuccess: () => {
        setSuccessMessage("Contact added successfully!");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          walletAddress: "",
        });
        
        setTimeout(() => {
          setShowForm(false);
          setSuccessMessage(null);
        }, 2000);
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.message || "Failed to add contact";
        setErrorMessage(msg);
      },
    });
  };

  const handleRemoveContact = (contactId: string) => {
    if (window.confirm("Are you sure you want to remove this contact?")) {
      setErrorMessage(null);
      removeContact(contactId, {
        onSuccess: () => {
          setSuccessMessage("Contact removed successfully!");
          setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.message || "Failed to remove contact";
          setErrorMessage(msg);
        },
      });
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      walletAddress: "",
    });
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <Header isAuthenticated={true} user={user || undefined} />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            My Contacts
          </h1>
          <p className="text-[var(--text-secondary)]">
            Manage your trusted contacts who can be added as beneficiaries or secondary members in your digital wills.
          </p>
        </div>



        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md"
        >
          + Add New Contact
        </button>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-section)] px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  Add New Contact
                </h2>
                <button
                  onClick={handleCancelForm}
                  className="text-[var(--text-muted-alt)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {errorMessage && (
                  <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="mb-6 px-4 py-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-sm">
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label 
                        htmlFor="firstName" 
                        className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                      >
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="John"
                      />
                    </div>

                    <div>
                      <label 
                        htmlFor="lastName" 
                        className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                      >
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label 
                      htmlFor="email" 
                      className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                    >
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="john.doe@example.com"
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="phoneNumber" 
                      className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                    >
                      Phone Number <span className="text-[var(--text-muted-alt)] text-xs">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="walletAddress" 
                      className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                    >
                      Wallet Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="walletAddress"
                      name="walletAddress"
                      value={formData.walletAddress}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                      placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                    />
                    <p className="mt-1 text-xs text-[var(--text-muted-alt)]">
                      Ethereum wallet address (starts with 0x)
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isAdding}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                    >
                      {isAdding ? "Adding..." : "Add Contact"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="px-6 py-2 bg-[var(--bg-section)] hover:bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              All Contacts ({contacts?.length || 0})
            </h2>

            {isLoading && (
              <p className="text-[var(--text-secondary)] text-center py-8">
                Loading contacts...
              </p>
            )}

            {error && (
              <p className="text-red-600 dark:text-red-400 text-center py-8">
                Failed to load contacts. Please try again.
              </p>
            )}

            {!isLoading && !error && contacts && contacts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)] mb-4">
                  No contacts yet. Add your first contact to get started.
                </p>
              </div>
            )}

            {!isLoading && !error && contacts && contacts.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-primary)]">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-primary)]">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-primary)]">
                        Phone
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-primary)]">
                        Wallet Address
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-primary)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact: Contact) => (
                      <tr
                        key={contact.contactId}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-4 px-4 text-[var(--text-primary)]">
                          {contact.firstName} {contact.lastName}
                        </td>
                        <td className="py-4 px-4 text-[var(--text-secondary)]">
                          {contact.email}
                        </td>
                        <td className="py-4 px-4 text-[var(--text-secondary)]">
                          {contact.phoneNumber || "-"}
                        </td>
                        <td className="py-4 px-4 text-[var(--text-secondary)] font-mono text-xs">
                          {contact.walletAddress.substring(0, 6)}...
                          {contact.walletAddress.substring(contact.walletAddress.length - 4)}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleRemoveContact(contact.contactId)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
