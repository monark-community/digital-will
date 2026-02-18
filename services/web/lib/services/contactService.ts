import { apiClient } from "../api-client";
import type { Contact } from "../types";

/**
 * Get all contacts for the current user
 */
export async function getContacts(): Promise<Contact[]> {
  const response = await apiClient.get("/contacts");
  return response.data.data.contacts;
}

/**
 * Add a new contact
 */
export async function addContact(data: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  walletAddress: string;
}): Promise<Contact> {
  const response = await apiClient.post("/contacts", data);
  return response.data.data.contact;
}

/**
 * Remove a contact
 */
export async function removeContact(contactId: string): Promise<void> {
  await apiClient.delete(`/contacts/${contactId}`);
}

/**
 * Update a contact
 */
export async function updateContact(
  contactId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    walletAddress?: string;
  }
): Promise<Contact> {
  const response = await apiClient.patch(`/contacts/${contactId}`, data);
  return response.data.data.contact;
}
