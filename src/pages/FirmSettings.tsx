import React, { useState } from 'react';
import { ChevronRight, Home, Building, CreditCard, Users, User, Settings, Bot, Plus, Mail, MoreHorizontal, Trash2, Tag, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VaultSidebar } from '@/components/VaultSidebar';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTagTypes } from '@/hooks/useTagTypes';
import { useVaultEdits } from '@/hooks/useVaultState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MOCK_CONTENT_ITEMS } from '@/data/mockVaultData';
import { migrateQuestionItems } from '@/utils/tagMigration';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member' | 'Customer Success';
  status: 'active' | 'pending';
  avatar?: string;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Alex Wright',
    email: 'alex.wright@s2strategy.com',
    role: 'Admin',
    status: 'active',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@s2strategy.com',
    role: 'Member',
    status: 'active',
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@s2strategy.com',
    role: 'Customer Success',
    status: 'pending',
  },
];

export function FirmSettings() {
  const { profile } = useUserProfile();
  const [activeTab, setActiveTab] = useState('general');
  const [isBuildingProfile, setIsBuildingProfile] = useState(false);
  const [isProfileBuilt, setIsProfileBuilt] = useState(false);
  const [firmWebsite, setFirmWebsite] = useState('');
  const [firmCrd, setFirmCrd] = useState('');
  const [autoCompleteValue, setAutoCompleteValue] = useState([0.5]);
  const [smartAssistantValue, setSmartAssistantValue] = useState([0.7]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  
  // Tag Types management
  const {
    tagTypes,
    createTagType,
    addTagTypeValue,
    removeTagTypeValue,
    deleteTagType,
    isTagValueInUse,
  } = useTagTypes();
  const { saveManyEdits, getEdit } = useVaultEdits();
  const [newTagTypeName, setNewTagTypeName] = useState('');
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] = useState<{ tagTypeName: string; value: string } | null>(null);
  
  // Get all vault items for checking tag usage
  const allVaultItems = migrateQuestionItems(
    MOCK_CONTENT_ITEMS.flatMap(doc => doc.items)
  );

  const handleResetProfile = async () => {
    setIsBuildingProfile(false);
    setFirmWebsite('');
    setFirmCrd('');
    setIsProfileBuilt(false);
    alert('Profile reset successfully!');
  }

  const handleBuildProfile = async () => {
    setIsBuildingProfile(true);
    // Simulate API call
    setTimeout(() => {
      setIsBuildingProfile(false);
      alert('Profile built successfully!');
      setIsProfileBuilt(true);
    }, 3000);
  };

  const handleResendInvite = (memberId: string) => {
    console.log('Resending invite for member:', memberId);
    alert('Invite resent successfully!');
  };

  const handleAddTeammate = () => {
    console.log('Adding new team member');
    alert('Add team member functionality would open here');
  };

  const handleDeleteMember = (memberId: string) => {
    if (window.confirm('Are you sure you want to delete this team member?')) {
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
      alert('Team member deleted successfully!');
    }
  };

  const handleRoleChange = (memberId: string, newRole: 'Admin' | 'Member' | 'Customer Success') => {
    setTeamMembers(prev => 
      prev.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      )
    );
    alert('Role updated successfully!');
  };

  // Tag Types handlers
  const handleCreateTagType = () => {
    if (!newTagTypeName.trim()) {
      alert('Please enter a tag type name');
      return;
    }
    const success = createTagType(newTagTypeName.trim());
    if (success) {
      setNewTagTypeName('');
      alert('Tag type created successfully!');
    } else {
      alert('A tag type with this name already exists');
    }
  };

  const handleAddValue = (tagTypeName: string) => {
    const value = newValueInputs[tagTypeName]?.trim();
    if (!value) {
      alert('Please enter a value');
      return;
    }
    const success = addTagTypeValue(tagTypeName, value);
    if (success) {
      setNewValueInputs(prev => ({ ...prev, [tagTypeName]: '' }));
      alert('Value added successfully!');
    } else {
      alert('This value already exists for this tag type');
    }
  };

  const handleDeleteValueClick = (tagTypeName: string, value: string) => {
    const inUse = isTagValueInUse(tagTypeName, value, allVaultItems);
    if (inUse) {
      setDeleteConfirmData({ tagTypeName, value });
      setDeleteConfirmOpen(true);
    } else {
      removeTagTypeValue(tagTypeName, value);
      alert('Value removed successfully!');
    }
  };

  // Helper function to remove a specific tag value from tags array
  const removeTagValueFromTags = (tags: any[], tagTypeName: string, tagValue: string): any[] => {
    if (!tags || !Array.isArray(tags)) {
      return [];
    }
    return tags.filter((tag: any) => {
      // Handle both old format (string) and new format (object with type and value)
      if (typeof tag === 'string') {
        // Old format - this shouldn't happen after migration, but handle it
        return tag !== tagValue;
      }
      if (typeof tag === 'object' && tag.type && tag.value) {
        // New format - filter out matching tag
        return !(tag.type === tagTypeName && tag.value === tagValue);
      }
      return true; // Keep unknown formats
    });
  };

  const handleConfirmDeleteValue = () => {
    if (deleteConfirmData) {
      const { tagTypeName, value } = deleteConfirmData;
      
      // Remove from allowed list
      removeTagTypeValue(tagTypeName, value);
      
      // Find all items that have this tag value and remove it
      const itemsToUpdate: Array<[string, any]> = [];
      
      allVaultItems.forEach((item) => {
        // Check if item has the tag (considering both original and edited tags)
        const existingEdit = getEdit(item.id);
        const currentTags = existingEdit?.tags || item.tags || [];
        
        // Check if this item has the tag we want to remove
        const hasTag = currentTags.some((tag: any) => {
          if (typeof tag === 'object' && tag.type && tag.value) {
            return tag.type === tagTypeName && tag.value === value;
          }
          return false;
        });
        
        if (hasTag) {
          // Remove the tag from this item
          const updatedTags = removeTagValueFromTags(currentTags, tagTypeName, value);
          itemsToUpdate.push([item.id, { tags: updatedTags }]);
        }
      });
      
      // Update all affected items at once
      if (itemsToUpdate.length > 0) {
        saveManyEdits(itemsToUpdate);
      }
      
      setDeleteConfirmOpen(false);
      setDeleteConfirmData(null);
      alert(`Value removed. It has been removed from ${itemsToUpdate.length} vault item${itemsToUpdate.length !== 1 ? 's' : ''} that used it.`);
    }
  };

  const handleDeleteTagType = (tagTypeName: string) => {
    if (window.confirm(`Are you sure you want to delete the tag type "${tagTypeName}"? This will remove all tags of this type from vault items.`)) {
      deleteTagType(tagTypeName);
      alert('Tag type deleted successfully!');
    }
  };

  return (
    <div className="h-screen bg-sidebar-background flex gap-4">
      {/* Vault Sidebar */}
      <VaultSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background mt-4 rounded-tl-2xl vault-scroll">
        <div className="flex-1 overflow-y-auto">
          {/* Header with Breadcrumbs */}
          <div className="border-b border-foreground/10 bg-background">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm mb-6 px-6 pt-6 max-w-[100rem] mx-auto">
              <Link to="/" className="text-foreground/70 hover:text-foreground">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4 text-foreground/70" />
              <span className="text-foreground font-medium">
                Firm Settings
              </span>
            </div>

            {/* Main Title */}
            <div className="flex items-center justify-between px-6 pb-6 max-w-[100rem] mx-auto">
              <div>
                <h1 className="text-2xl font-semibold">Firm Settings</h1>
                <p className="text-foreground/70">Manage your firm's settings and preferences</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-8">
            <div className="max-w-4xl mx-auto h-full">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="team" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Members
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Firm Profile
                  </TabsTrigger>
                  <TabsTrigger value="tags" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tag Types
                  </TabsTrigger>
                </TabsList>

                {/* General Tab - Subscription & Billing */}
                <TabsContent value="general" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Subscription & Billing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Subscription */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium">Subscription</h3>
                          <p className="text-sm text-foreground/70">Your current plan:</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-sm px-3 py-1">
                            Preview
                          </Badge>
                          <span className="text-sm text-foreground/70">Free trial plan</span>
                        </div>
                      </div>

                      {/* Billing */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium">Billing</h3>
                          <p className="text-sm text-foreground/70">Manage your billing information and subscription details</p>
                        </div>
                        <Button className="bg-sidebar-primary hover:bg-sidebar-primary/80">
                          Subscribe to AdviserGPT
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Team Members Tab */}
                <TabsContent value="team" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Team Members</CardTitle>
                          <CardDescription>Manage your team and their access</CardDescription>
                        </div>
                        <Button onClick={handleAddTeammate} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Team Member
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {teamMembers.map((member) => (
                          <div key={member.id} className="group flex items-center justify-between p-4 border border-foreground/10 rounded-lg hover:bg-foreground/5 transition-colors">
                            <div className="flex items-center gap-4">
                              {member.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-foreground/10"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center border-2 border-foreground/10">
                                  <User className="w-5 h-5 text-foreground/70" />
                                </div>
                              )}
                              <div className="space-y-1">
                                <div className="font-medium flex items-center gap-2">
                                  {member.name}
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={member.role}
                                      onValueChange={(value: 'Admin' | 'Member' | 'Customer Success') => 
                                        handleRoleChange(member.id, value)
                                      }
                                    >
                                      <SelectTrigger className="w-auto h-6 text-xs border border-foreground/20 bg-transparent p-1 hover:bg-foreground/5">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Member">Member</SelectItem>
                                        <SelectItem value="Customer Success">Customer Success</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Badge 
                                      variant={member.status === 'active' ? 'default' : 'secondary'} 
                                      className="text-xs"
                                    >
                                      {member.status}
                                    </Badge>
                                    {member.status === 'pending' && (
                                    <Button
                                      variant="outline"
                                      size="xs"
                                      onClick={() => handleResendInvite(member.id)}
                                      className="flex text-xs items-center gap-2"
                                    >
                                      Resend
                                    </Button>
                                  )}
                                  </div>
                                </div>
                                <div className="text-sm text-foreground/70">{member.email}</div>
                              </div>
                            </div>
                            
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMember(member.id)}
                                className="h-8 w-8 p-0 text-sidebar-accent/70 hover:text-sidebar-accent hover:bg-sidebar-accent/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Firm Profile Tab */}
                <TabsContent value="profile" className="space-y-6 mt-6">
                  {isBuildingProfile ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sidebar-primary mb-4"></div>
                        <h3 className="text-lg font-medium mb-2">Submitting your profile...</h3>
                        <p className="text-foreground/70">This may take a minute.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Firm Profile</CardTitle>
                        <CardDescription>Complete your firm's profile information</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {!isProfileBuilt && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            Your profile is incomplete. Please fill out the required information below.
                          </AlertDescription>
                        </Alert>
                        )}

                        <div className="flex items-center gap-6">
                          <div className="flex-1">
                            <Label className="block mb-2" htmlFor="firmWebsite">Firm Website</Label>
                            <Input
                              id="firmWebsite"
                              type="url"
                              value={firmWebsite}
                              onChange={(e) => setFirmWebsite(e.target.value)}
                            />
                            <p className="text-xs mt-1 text-foreground/70">https://example.com</p>
                          </div>

                          <div className="flex-1">
                            <Label className="block mb-2" htmlFor="firmCrd">Firm CRD #</Label>
                            <Input
                              id="firmCrd"
                              value={firmCrd}
                              maxLength={7}
                              inputMode="decimal"
                              pattern="[0-9]*"
                              placeholder="XXXXXXX"
                              onChange={(e) => setFirmCrd(e.target.value)}
                            />
                            <p className="text-xs mt-1 text-foreground/70">Seven-digit identifer assigned by FINRA</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <Button variant="outline" onClick={handleResetProfile} className="">
                            Reset Profile
                          </Button>
                          <Button onClick={handleBuildProfile} className="bg-sidebar-primary hover:bg-sidebar-primary/80">
                            Build Profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Tag Types Tab */}
                <TabsContent value="tags" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Tag Types</CardTitle>
                          <CardDescription>Create and manage tag types and their allowed values</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="New tag type name"
                            value={newTagTypeName}
                            onChange={(e) => setNewTagTypeName(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleCreateTagType();
                              }
                            }}
                            className="w-48"
                          />
                          <Button onClick={handleCreateTagType} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create Tag Type
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {tagTypes.map((tagType) => (
                          <div
                            key={tagType.id}
                            className="border border-foreground/10 rounded-lg p-4 space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-semibold">{tagType.name}</h3>
                                <p className="text-sm text-foreground/70">
                                  {tagType.values.length} value{tagType.values.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTagType(tagType.name)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Values List */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Allowed Values</Label>
                              <div className="flex flex-wrap gap-2">
                                {tagType.values.map((value) => (
                                  <Badge
                                    key={value}
                                    variant="secondary"
                                    className="flex items-center gap-1 px-2 py-1"
                                  >
                                    {value}
                                    <X
                                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                                      onClick={() => handleDeleteValueClick(tagType.name, value)}
                                    />
                                  </Badge>
                                ))}
                                {tagType.values.length === 0 && (
                                  <p className="text-sm text-foreground/60">No values yet</p>
                                )}
                              </div>
                            </div>

                            {/* Add Value Input */}
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add new value"
                                value={newValueInputs[tagType.name] || ''}
                                onChange={(e) =>
                                  setNewValueInputs(prev => ({
                                    ...prev,
                                    [tagType.name]: e.target.value,
                                  }))
                                }
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddValue(tagType.name);
                                  }
                                }}
                                className="flex-1"
                              />
                              <Button
                                onClick={() => handleAddValue(tagType.name)}
                                size="sm"
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        ))}
                        {tagTypes.length === 0 && (
                          <div className="text-center py-8 text-foreground/60">
                            <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No tag types yet. Create one to get started.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription>
                        {deleteConfirmData && (
                          <>
                            This will remove the <strong>{deleteConfirmData.tagTypeName}</strong> tag &quot;
                            <strong>{deleteConfirmData.value}</strong>&quot; from any vault item it is currently
                            applied to.
                            <br />
                            <br />
                            Are you sure you want to continue?
                          </>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleConfirmDeleteValue} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
