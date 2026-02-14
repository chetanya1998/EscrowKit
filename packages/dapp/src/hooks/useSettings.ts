
"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { API_BASE_URL } from '@/lib/utils';
import { toast } from 'sonner';

// Define User Interface
export interface UserProfile {
    address: string;
    username?: string;
    email?: string;
    bio?: string;
    avatar?: string;
    preferences?: {
        theme?: 'light' | 'dark' | 'system';
        notifications?: {
            email: boolean;
            inApp: boolean;
        }
    };
}

// Fetch Profile
const fetchProfile = async (address: string): Promise<UserProfile> => {
    const res = await fetch(`${API_BASE_URL}/users/${address}`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
};

// Update Profile
const updateProfileRequest = async ({ address, data }: { address: string, data: Partial<UserProfile> }): Promise<UserProfile> => {
    const res = await fetch(`${API_BASE_URL}/users/${address}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
};

export function useSettings() {
    const { address } = useAccount();
    const queryClient = useQueryClient();

    const profileQuery = useQuery({
        queryKey: ['user-profile', address],
        queryFn: () => fetchProfile(address!),
        enabled: !!address,
    });

    const updateMutation = useMutation({
        mutationFn: updateProfileRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile', address] });
            toast.success("Profile updated successfully");
        },
        onError: () => {
            toast.error("Failed to update profile");
        }
    });

    return {
        profile: profileQuery.data,
        isLoading: profileQuery.isLoading,
        updateProfile: (data: Partial<UserProfile>) => {
            if (address) {
                updateMutation.mutate({ address, data });
            }
        },
        isUpdating: updateMutation.isPending,
    };
}
