-- Migration 5: User roles and team members
-- Adds platform roles (super_admin, user) and team member system

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Add platform role to profiles
ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('super_admin', 'user'));

-- 2. Team members: links team members to a business owner's account
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Owner can manage their team members
CREATE POLICY "Owners can view team members" ON team_members FOR SELECT USING (owner_id = auth.uid() OR member_user_id = auth.uid());
CREATE POLICY "Owners can insert team members" ON team_members FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update team members" ON team_members FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete team members" ON team_members FOR DELETE USING (owner_id = auth.uid());

-- 3. Team invitations: track pending invitations
CREATE TABLE team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own invitations" ON team_invitations FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Owners can insert invitations" ON team_invitations FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update own invitations" ON team_invitations FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete own invitations" ON team_invitations FOR DELETE USING (owner_id = auth.uid());
-- Invitees can view and accept their invitations (matched by email from auth.users)
CREATE POLICY "Invitees can view invitations" ON team_invitations FOR SELECT USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
CREATE POLICY "Invitees can accept invitations" ON team_invitations FOR UPDATE USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 4. Helper function: get the owner_id for a user (returns their own id if they're an owner, or the owner_id if they're a team member)
CREATE OR REPLACE FUNCTION get_owner_id(uid uuid)
RETURNS uuid AS $$
DECLARE
  owner uuid;
BEGIN
  -- Check if user is a team member under someone
  SELECT tm.owner_id INTO owner FROM team_members tm WHERE tm.member_user_id = uid LIMIT 1;
  IF owner IS NOT NULL THEN
    RETURN owner;
  END IF;
  -- Otherwise they are the owner themselves
  RETURN uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Super admin policies — super admins can view ALL data across the platform
-- We add these as additional SELECT policies (OR with existing ones)

-- Super admin can view all profiles
CREATE POLICY "Super admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
);
CREATE POLICY "Super admins can update all profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
);

-- Super admin can view all contacts
CREATE POLICY "Super admins can view all contacts" ON contacts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
);

-- Super admin can view all conversations
CREATE POLICY "Super admins can view all conversations" ON conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
);

-- Super admin can view all messages
CREATE POLICY "Super admins can view all messages" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
);

-- Super admin can view all channels
CREATE POLICY "Super admins can view all channels" ON channels FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
);

-- Super admin can view all subscriptions
CREATE POLICY "Super admins can view all subscriptions" ON subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
);

-- Super admin can view all team members
CREATE POLICY "Super admins can view all team members" ON team_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
);

-- Super admin can view all invitations
CREATE POLICY "Super admins can view all invitations" ON team_invitations FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
);

-- 6. Team member access: allow team members to access their owner's data
-- Contacts
CREATE POLICY "Team members can view owner contacts" ON contacts FOR SELECT USING (
  user_id IN (SELECT owner_id FROM team_members WHERE member_user_id = auth.uid())
);
CREATE POLICY "Team members can insert owner contacts" ON contacts FOR INSERT WITH CHECK (
  user_id IN (SELECT owner_id FROM team_members WHERE member_user_id = auth.uid() AND role IN ('admin', 'member'))
);
CREATE POLICY "Team members can update owner contacts" ON contacts FOR UPDATE USING (
  user_id IN (SELECT owner_id FROM team_members WHERE member_user_id = auth.uid() AND role IN ('admin', 'member'))
);

-- Conversations
CREATE POLICY "Team members can view owner conversations" ON conversations FOR SELECT USING (
  user_id IN (SELECT owner_id FROM team_members WHERE member_user_id = auth.uid())
);
CREATE POLICY "Team members can insert owner conversations" ON conversations FOR INSERT WITH CHECK (
  user_id IN (SELECT owner_id FROM team_members WHERE member_user_id = auth.uid() AND role IN ('admin', 'member'))
);
CREATE POLICY "Team members can update owner conversations" ON conversations FOR UPDATE USING (
  user_id IN (SELECT owner_id FROM team_members WHERE member_user_id = auth.uid() AND role IN ('admin', 'member'))
);

-- Messages
CREATE POLICY "Team members can view owner messages" ON messages FOR SELECT USING (
  user_id IN (SELECT owner_id FROM team_members WHERE member_user_id = auth.uid())
);
CREATE POLICY "Team members can insert owner messages" ON messages FOR INSERT WITH CHECK (
  user_id IN (SELECT owner_id FROM team_members WHERE member_user_id = auth.uid() AND role IN ('admin', 'member'))
);

-- Channels
CREATE POLICY "Team members can view owner channels" ON channels FOR SELECT USING (
  user_id IN (SELECT owner_id FROM team_members WHERE member_user_id = auth.uid())
);

-- 7. Indexes for performance
CREATE INDEX idx_team_members_owner ON team_members(owner_id);
CREATE INDEX idx_team_members_member ON team_members(member_user_id);
CREATE INDEX idx_team_invitations_owner ON team_invitations(owner_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_profiles_role ON profiles(role);

-- 8. Updated_at triggers
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
