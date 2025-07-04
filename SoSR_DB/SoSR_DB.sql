USE [master]
GO
/****** Object:  Database [SoSR_DB]    Script Date: 5/15/2025 3:30:22 AM ******/
CREATE DATABASE [SoSR_DB]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'SoSR_DB', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA\SoSR_DB.mdf' , SIZE = 73728KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'SoSR_DB_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA\SoSR_DB_log.ldf' , SIZE = 663552KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
ALTER DATABASE [SoSR_DB] SET COMPATIBILITY_LEVEL = 160
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [SoSR_DB].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [SoSR_DB] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [SoSR_DB] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [SoSR_DB] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [SoSR_DB] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [SoSR_DB] SET ARITHABORT OFF 
GO
ALTER DATABASE [SoSR_DB] SET AUTO_CLOSE ON 
GO
ALTER DATABASE [SoSR_DB] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [SoSR_DB] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [SoSR_DB] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [SoSR_DB] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [SoSR_DB] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [SoSR_DB] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [SoSR_DB] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [SoSR_DB] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [SoSR_DB] SET  ENABLE_BROKER 
GO
ALTER DATABASE [SoSR_DB] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [SoSR_DB] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [SoSR_DB] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [SoSR_DB] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [SoSR_DB] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [SoSR_DB] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [SoSR_DB] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [SoSR_DB] SET RECOVERY SIMPLE 
GO
ALTER DATABASE [SoSR_DB] SET  MULTI_USER 
GO
ALTER DATABASE [SoSR_DB] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [SoSR_DB] SET DB_CHAINING OFF 
GO
ALTER DATABASE [SoSR_DB] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [SoSR_DB] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [SoSR_DB] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [SoSR_DB] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
ALTER DATABASE [SoSR_DB] SET QUERY_STORE = ON
GO
ALTER DATABASE [SoSR_DB] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [SoSR_DB]
GO
/****** Object:  User [DBAdmin]    Script Date: 5/15/2025 3:30:22 AM ******/
CREATE USER [DBAdmin] FOR LOGIN [DBAdmin] WITH DEFAULT_SCHEMA=[dbo]
GO
ALTER ROLE [db_datareader] ADD MEMBER [DBAdmin]
GO
ALTER ROLE [db_datawriter] ADD MEMBER [DBAdmin]
GO
/****** Object:  Table [dbo].[Alliances]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Alliances](
	[AllianceID] [int] IDENTITY(1,1) NOT NULL,
	[AllianceName] [nvarchar](100) NOT NULL,
 CONSTRAINT [PK_Alliances] PRIMARY KEY CLUSTERED 
(
	[AllianceID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CharacterAttributes]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CharacterAttributes](
	[CharacterAttributeID] [int] IDENTITY(1,1) NOT NULL,
	[CharacterID] [int] NOT NULL,
	[CoreAttributeID] [int] NOT NULL,
	[Value] [int] NULL,
	[MaxCap] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[CharacterAttributeID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CharacterFavor]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CharacterFavor](
	[CharacterID] [int] NOT NULL,
	[FavorPoints] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[CharacterID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CharacterLanguages]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CharacterLanguages](
	[CharacterLanguageID] [int] IDENTITY(1,1) NOT NULL,
	[CharacterID] [int] NOT NULL,
	[Language] [nvarchar](100) NOT NULL,
	[ProficiencyLevel] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[CharacterLanguageID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CharacterNotes]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CharacterNotes](
	[CharacterID] [int] NOT NULL,
	[Notes] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[CharacterID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Characters]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Characters](
	[CharacterID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](1000) NULL,
	[Created_At] [datetime] NULL,
	[Age] [int] NOT NULL,
	[House] [nvarchar](255) NULL,
	[Favor] [int] NULL,
	[AssignedSlot] [tinyint] NOT NULL,
	[Sex] [varchar](10) NULL,
	[ImagePath] [nvarchar](255) NULL,
	[History] [nvarchar](max) NULL,
	[appStatus] [varchar](10) NOT NULL,
	[ModifiedBy] [varchar](100) NULL,
	[Holding] [int] NULL,
	[HouseID] [int] NULL,
	[ApplyingHoH] [bit] NOT NULL,
	[RegionID] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[CharacterID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CharacterSecondaryAttributes]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CharacterSecondaryAttributes](
	[CharacterSecondaryAttributeID] [int] IDENTITY(1,1) NOT NULL,
	[CharacterID] [int] NOT NULL,
	[DefensiveRating] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[CharacterSecondaryAttributeID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CharacterSkills]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CharacterSkills](
	[CharacterSkillID] [int] IDENTITY(1,1) NOT NULL,
	[CharacterID] [int] NOT NULL,
	[SkillID] [int] NOT NULL,
	[Value] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[CharacterSkillID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CharacterWounds]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CharacterWounds](
	[CharacterID] [int] NOT NULL,
	[Wounds] [int] NULL,
	[LastUpdated] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[CharacterID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CoreAttributes]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CoreAttributes](
	[CoreAttributeID] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[CoreAttributeID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Holding_Cells]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Holding_Cells](
	[HoldingID] [int] NOT NULL,
	[MapID] [int] NOT NULL,
	[Col] [int] NOT NULL,
	[Row] [int] NOT NULL,
 CONSTRAINT [PK_HoldingCells] PRIMARY KEY CLUSTERED 
(
	[HoldingID] ASC,
	[MapID] ASC,
	[Col] ASC,
	[Row] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[HoldingResources]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HoldingResources](
	[HoldingResourceID] [int] IDENTITY(1,1) NOT NULL,
	[HoldingID] [int] NOT NULL,
	[ResourceID] [int] NOT NULL,
	[CurrentAmount] [int] NOT NULL,
	[MaxAmount] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[HoldingResourceID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_HoldingResources_HoldingID_ResourceID] UNIQUE NONCLUSTERED 
(
	[HoldingID] ASC,
	[ResourceID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Holdings]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Holdings](
	[HoldingID] [int] IDENTITY(1,1) NOT NULL,
	[MapID] [int] NOT NULL,
	[HoldingName] [nvarchar](100) NOT NULL,
	[HouseID] [int] NULL,
	[AllianceID] [int] NULL,
	[DefensiveNodes] [int] NOT NULL,
	[col] [int] NOT NULL,
	[row] [int] NOT NULL,
	[RulingCharacterID] [int] NULL,
	[Region] [int] NULL,
	[ImagePath] [nvarchar](255) NULL,
	[SettlementTier] [int] NOT NULL,
	[PrimaryResourceID] [int] NULL,
	[SecondaryResourceID] [int] NULL,
	[DefenseTier] [int] NOT NULL,
 CONSTRAINT [PK_Holdings] PRIMARY KEY CLUSTERED 
(
	[HoldingID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Houses]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Houses](
	[HouseID] [int] IDENTITY(1,1) NOT NULL,
	[HouseName] [nvarchar](100) NOT NULL,
	[AllianceID] [int] NULL,
	[HoH] [int] NULL,
	[HouseColor] [nvarchar](20) NOT NULL,
	[Region] [int] NULL,
 CONSTRAINT [PK_Houses] PRIMARY KEY CLUSTERED 
(
	[HouseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Letters]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Letters](
	[LetterId] [int] IDENTITY(1,1) NOT NULL,
	[AuthorCharId] [int] NOT NULL,
	[CurrentOwnerCharId] [int] NOT NULL,
	[ToName] [nvarchar](255) NOT NULL,
	[FromName] [nvarchar](255) NOT NULL,
	[Content] [nvarchar](max) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[LetterId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LetterTransfers]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LetterTransfers](
	[TransferId] [int] IDENTITY(1,1) NOT NULL,
	[LetterId] [int] NOT NULL,
	[FromCharId] [int] NOT NULL,
	[ToCharId] [int] NOT NULL,
	[TransferredAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[TransferId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Map_Cells]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Map_Cells](
	[MapID] [int] NOT NULL,
	[Col] [int] NOT NULL,
	[Row] [int] NOT NULL,
	[TerrainID] [int] NULL,
	[RegionID] [int] NULL,
	[HouseID] [int] NULL,
	[AllianceID] [int] NULL,
	[Passable] [bit] NOT NULL,
	[MovementCost] [int] NOT NULL,
	[StealthMod] [int] NOT NULL,
 CONSTRAINT [PK_MapCells] PRIMARY KEY CLUSTERED 
(
	[MapID] ASC,
	[Col] ASC,
	[Row] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Maps]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Maps](
	[MapID] [int] IDENTITY(1,1) NOT NULL,
	[MapName] [nvarchar](100) NOT NULL,
	[TotalCols] [int] NOT NULL,
	[TotalRows] [int] NOT NULL,
	[ImageWidth] [int] NOT NULL,
	[ImageHeight] [int] NOT NULL,
	[HexWidth] [int] NOT NULL,
	[HexHeight] [int] NOT NULL,
 CONSTRAINT [PK_Maps] PRIMARY KEY CLUSTERED 
(
	[MapID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Parties]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Parties](
	[PartyID] [int] IDENTITY(1,1) NOT NULL,
	[PartyName] [nvarchar](100) NOT NULL,
	[PartyCommanderCharacterID] [int] NOT NULL,
 CONSTRAINT [PK_Parties] PRIMARY KEY CLUSTERED 
(
	[PartyID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Regions]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Regions](
	[RegionID] [int] IDENTITY(1,1) NOT NULL,
	[RegionName] [nvarchar](100) NOT NULL,
	[regionColor] [varchar](7) NULL,
	[rulingHouse] [int] NULL,
 CONSTRAINT [PK_Regions] PRIMARY KEY CLUSTERED 
(
	[RegionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Resources]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Resources](
	[ResourceID] [int] IDENTITY(1,1) NOT NULL,
	[ResourceName] [varchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[ResourceID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Skills]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Skills](
	[SkillID] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[CoreAttributeID] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[SkillID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TerrainTypes]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TerrainTypes](
	[TerrainID] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](50) NOT NULL,
	[Passable] [bit] NOT NULL,
	[MovementCost] [int] NOT NULL,
	[StealthMod] [int] NOT NULL,
	[Color] [nvarchar](20) NOT NULL,
	[DefenseMod] [int] NOT NULL,
	[MoraleMod] [int] NOT NULL,
	[AttritionMod] [int] NOT NULL,
	[FleeMod] [int] NOT NULL,
	[PerceptionMod] [int] NOT NULL,
 CONSTRAINT [PK_TerrainTypes] PRIMARY KEY CLUSTERED 
(
	[TerrainID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TierBaseOutputs]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TierBaseOutputs](
	[TierLevel] [int] NOT NULL,
	[BaseOutput] [int] NOT NULL,
	[BaseStorage] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[TierLevel] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Units]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Units](
	[UnitID] [int] IDENTITY(1,1) NOT NULL,
	[UnitTypeID] [int] NOT NULL,
	[OwnerCharacterID] [int] NULL,
	[CommanderID] [int] NULL,
	[AdminCreated] [bit] NOT NULL,
	[UnitName] [nvarchar](100) NOT NULL,
	[Manpower] [int] NOT NULL,
	[ShipCount] [int] NOT NULL,
	[CurrentMapID] [int] NOT NULL,
	[DestinationMapID] [int] NULL,
	[Waypoint1MapID] [int] NULL,
	[Waypoint2MapID] [int] NULL,
	[Waypoint3MapID] [int] NULL,
	[Waypoint4MapID] [int] NULL,
	[Waypoint5MapID] [int] NULL,
	[Waypoint6MapID] [int] NULL,
	[Waypoint7MapID] [int] NULL,
	[Waypoint8MapID] [int] NULL,
	[Waypoint9MapID] [int] NULL,
	[Waypoint10MapID] [int] NULL,
	[CycleWaypoints] [bit] NOT NULL,
	[col] [int] NULL,
	[row] [int] NULL,
	[HomeHoldingID] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[UnitID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UnitTypes]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UnitTypes](
	[UnitTypeID] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](50) NOT NULL,
	[Manpower] [int] NOT NULL,
	[initialFood] [int] NOT NULL,
	[initialGold] [int] NOT NULL,
	[MovementSpeed] [float] NOT NULL,
	[ImagePath] [nvarchar](255) NULL,
	[upkeepMod] [decimal](5, 2) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UnitTypeID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UnitWaypoints]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UnitWaypoints](
	[UnitWaypointID] [int] IDENTITY(1,1) NOT NULL,
	[UnitID] [int] NOT NULL,
	[SequenceOrder] [tinyint] NOT NULL,
	[MapID] [int] NOT NULL,
	[RouteLogic] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UnitWaypointID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Users]    Script Date: 5/15/2025 3:30:22 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Users](
	[UserID] [int] IDENTITY(1,1) NOT NULL,
	[SL_UUID] [uniqueidentifier] NOT NULL,
	[SL_Username] [nvarchar](255) NOT NULL,
	[Created_At] [datetime] NULL,
	[ActiveCharacterID] [int] NULL,
	[ActiveSlot] [tinyint] NOT NULL,
	[IsAdmin] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UserID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[SL_Username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[SL_UUID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Index [IX_Letters_OwnerChar]    Script Date: 5/15/2025 3:30:22 AM ******/
CREATE NONCLUSTERED INDEX [IX_Letters_OwnerChar] ON [dbo].[Letters]
(
	[CurrentOwnerCharId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Transfers_Letter]    Script Date: 5/15/2025 3:30:22 AM ******/
CREATE NONCLUSTERED INDEX [IX_Transfers_Letter] ON [dbo].[LetterTransfers]
(
	[LetterId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[CharacterFavor] ADD  DEFAULT ((0)) FOR [FavorPoints]
GO
ALTER TABLE [dbo].[Characters] ADD  DEFAULT (getdate()) FOR [Created_At]
GO
ALTER TABLE [dbo].[Characters] ADD  DEFAULT ((18)) FOR [Age]
GO
ALTER TABLE [dbo].[Characters] ADD  DEFAULT ((0)) FOR [Favor]
GO
ALTER TABLE [dbo].[Characters] ADD  CONSTRAINT [DF_Characters_AssignedSlot]  DEFAULT ((0)) FOR [AssignedSlot]
GO
ALTER TABLE [dbo].[Characters] ADD  DEFAULT ('Pending') FOR [appStatus]
GO
ALTER TABLE [dbo].[Characters] ADD  CONSTRAINT [DF_Characters_ApplyingHoH]  DEFAULT ((0)) FOR [ApplyingHoH]
GO
ALTER TABLE [dbo].[CharacterWounds] ADD  DEFAULT ((0)) FOR [Wounds]
GO
ALTER TABLE [dbo].[CharacterWounds] ADD  DEFAULT (getdate()) FOR [LastUpdated]
GO
ALTER TABLE [dbo].[HoldingResources] ADD  CONSTRAINT [DF_HoldingResources_CurrentAmount]  DEFAULT ((0)) FOR [CurrentAmount]
GO
ALTER TABLE [dbo].[HoldingResources] ADD  CONSTRAINT [DF_HoldingResources_MaxAmount]  DEFAULT ((0)) FOR [MaxAmount]
GO
ALTER TABLE [dbo].[Holdings] ADD  DEFAULT ((0)) FOR [DefensiveNodes]
GO
ALTER TABLE [dbo].[Holdings] ADD  DEFAULT ((0)) FOR [col]
GO
ALTER TABLE [dbo].[Holdings] ADD  DEFAULT ((0)) FOR [row]
GO
ALTER TABLE [dbo].[Holdings] ADD  CONSTRAINT [DF_Holdings_SettlementTier]  DEFAULT ((1)) FOR [SettlementTier]
GO
ALTER TABLE [dbo].[Holdings] ADD  CONSTRAINT [DF_Holdings_DefenseTier]  DEFAULT ((1)) FOR [DefenseTier]
GO
ALTER TABLE [dbo].[Houses] ADD  DEFAULT ('#FFFFFF') FOR [HouseColor]
GO
ALTER TABLE [dbo].[Letters] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[LetterTransfers] ADD  DEFAULT (sysutcdatetime()) FOR [TransferredAt]
GO
ALTER TABLE [dbo].[Map_Cells] ADD  DEFAULT ((1)) FOR [Passable]
GO
ALTER TABLE [dbo].[Map_Cells] ADD  DEFAULT ((1)) FOR [MovementCost]
GO
ALTER TABLE [dbo].[Map_Cells] ADD  DEFAULT ((0)) FOR [StealthMod]
GO
ALTER TABLE [dbo].[TerrainTypes] ADD  DEFAULT ((1)) FOR [Passable]
GO
ALTER TABLE [dbo].[TerrainTypes] ADD  DEFAULT ((1)) FOR [MovementCost]
GO
ALTER TABLE [dbo].[TerrainTypes] ADD  DEFAULT ((0)) FOR [StealthMod]
GO
ALTER TABLE [dbo].[TerrainTypes] ADD  CONSTRAINT [DF_TerrainTypes_Color]  DEFAULT ('#ffffff') FOR [Color]
GO
ALTER TABLE [dbo].[TerrainTypes] ADD  DEFAULT ((0)) FOR [DefenseMod]
GO
ALTER TABLE [dbo].[TerrainTypes] ADD  DEFAULT ((0)) FOR [MoraleMod]
GO
ALTER TABLE [dbo].[TerrainTypes] ADD  DEFAULT ((0)) FOR [AttritionMod]
GO
ALTER TABLE [dbo].[TerrainTypes] ADD  DEFAULT ((0)) FOR [FleeMod]
GO
ALTER TABLE [dbo].[TerrainTypes] ADD  DEFAULT ((0)) FOR [PerceptionMod]
GO
ALTER TABLE [dbo].[TierBaseOutputs] ADD  CONSTRAINT [DF_TierBaseOutputs_BaseStorage]  DEFAULT ((1000)) FOR [BaseStorage]
GO
ALTER TABLE [dbo].[Units] ADD  DEFAULT ((0)) FOR [AdminCreated]
GO
ALTER TABLE [dbo].[Units] ADD  DEFAULT ((100)) FOR [Manpower]
GO
ALTER TABLE [dbo].[Units] ADD  DEFAULT ((0)) FOR [ShipCount]
GO
ALTER TABLE [dbo].[Units] ADD  DEFAULT ((0)) FOR [CycleWaypoints]
GO
ALTER TABLE [dbo].[UnitTypes] ADD  DEFAULT ((1.0)) FOR [MovementSpeed]
GO
ALTER TABLE [dbo].[UnitTypes] ADD  CONSTRAINT [DF_UnitTypes_upkeepMod]  DEFAULT ((1.0)) FOR [upkeepMod]
GO
ALTER TABLE [dbo].[UnitWaypoints] ADD  DEFAULT ('Direct') FOR [RouteLogic]
GO
ALTER TABLE [dbo].[Users] ADD  DEFAULT (getdate()) FOR [Created_At]
GO
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_ActiveSlot]  DEFAULT ((0)) FOR [ActiveSlot]
GO
ALTER TABLE [dbo].[Users] ADD  DEFAULT ((0)) FOR [IsAdmin]
GO
ALTER TABLE [dbo].[CharacterAttributes]  WITH CHECK ADD  CONSTRAINT [FK_CharacterAttributes_Attribute] FOREIGN KEY([CoreAttributeID])
REFERENCES [dbo].[CoreAttributes] ([CoreAttributeID])
GO
ALTER TABLE [dbo].[CharacterAttributes] CHECK CONSTRAINT [FK_CharacterAttributes_Attribute]
GO
ALTER TABLE [dbo].[CharacterAttributes]  WITH CHECK ADD  CONSTRAINT [FK_CharacterAttributes_Character] FOREIGN KEY([CharacterID])
REFERENCES [dbo].[Characters] ([CharacterID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CharacterAttributes] CHECK CONSTRAINT [FK_CharacterAttributes_Character]
GO
ALTER TABLE [dbo].[CharacterFavor]  WITH CHECK ADD  CONSTRAINT [FK_Favor_Character] FOREIGN KEY([CharacterID])
REFERENCES [dbo].[Characters] ([CharacterID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CharacterFavor] CHECK CONSTRAINT [FK_Favor_Character]
GO
ALTER TABLE [dbo].[CharacterLanguages]  WITH CHECK ADD  CONSTRAINT [FK_CharacterLanguages_Character] FOREIGN KEY([CharacterID])
REFERENCES [dbo].[Characters] ([CharacterID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CharacterLanguages] CHECK CONSTRAINT [FK_CharacterLanguages_Character]
GO
ALTER TABLE [dbo].[CharacterNotes]  WITH CHECK ADD  CONSTRAINT [FK_CharacterNotes_Character] FOREIGN KEY([CharacterID])
REFERENCES [dbo].[Characters] ([CharacterID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CharacterNotes] CHECK CONSTRAINT [FK_CharacterNotes_Character]
GO
ALTER TABLE [dbo].[Characters]  WITH CHECK ADD  CONSTRAINT [FK_Character_User] FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Characters] CHECK CONSTRAINT [FK_Character_User]
GO
ALTER TABLE [dbo].[Characters]  WITH CHECK ADD  CONSTRAINT [FK_Characters_Holdings] FOREIGN KEY([Holding])
REFERENCES [dbo].[Holdings] ([HoldingID])
GO
ALTER TABLE [dbo].[Characters] CHECK CONSTRAINT [FK_Characters_Holdings]
GO
ALTER TABLE [dbo].[CharacterSecondaryAttributes]  WITH CHECK ADD  CONSTRAINT [FK_CharacterSecondaryAttributes_Characters] FOREIGN KEY([CharacterID])
REFERENCES [dbo].[Characters] ([CharacterID])
GO
ALTER TABLE [dbo].[CharacterSecondaryAttributes] CHECK CONSTRAINT [FK_CharacterSecondaryAttributes_Characters]
GO
ALTER TABLE [dbo].[CharacterSkills]  WITH CHECK ADD  CONSTRAINT [FK_CharacterSkills_Character] FOREIGN KEY([CharacterID])
REFERENCES [dbo].[Characters] ([CharacterID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CharacterSkills] CHECK CONSTRAINT [FK_CharacterSkills_Character]
GO
ALTER TABLE [dbo].[CharacterSkills]  WITH CHECK ADD  CONSTRAINT [FK_CharacterSkills_Skill] FOREIGN KEY([SkillID])
REFERENCES [dbo].[Skills] ([SkillID])
GO
ALTER TABLE [dbo].[CharacterSkills] CHECK CONSTRAINT [FK_CharacterSkills_Skill]
GO
ALTER TABLE [dbo].[CharacterWounds]  WITH CHECK ADD  CONSTRAINT [FK_Wounds_Character] FOREIGN KEY([CharacterID])
REFERENCES [dbo].[Characters] ([CharacterID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CharacterWounds] CHECK CONSTRAINT [FK_Wounds_Character]
GO
ALTER TABLE [dbo].[Holding_Cells]  WITH CHECK ADD  CONSTRAINT [FK_HoldingCells_Holding] FOREIGN KEY([HoldingID])
REFERENCES [dbo].[Holdings] ([HoldingID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Holding_Cells] CHECK CONSTRAINT [FK_HoldingCells_Holding]
GO
ALTER TABLE [dbo].[Holding_Cells]  WITH CHECK ADD  CONSTRAINT [FK_HoldingCells_MapCell] FOREIGN KEY([MapID], [Col], [Row])
REFERENCES [dbo].[Map_Cells] ([MapID], [Col], [Row])
GO
ALTER TABLE [dbo].[Holding_Cells] CHECK CONSTRAINT [FK_HoldingCells_MapCell]
GO
ALTER TABLE [dbo].[HoldingResources]  WITH CHECK ADD  CONSTRAINT [FK_HoldingResources_Holdings] FOREIGN KEY([HoldingID])
REFERENCES [dbo].[Holdings] ([HoldingID])
GO
ALTER TABLE [dbo].[HoldingResources] CHECK CONSTRAINT [FK_HoldingResources_Holdings]
GO
ALTER TABLE [dbo].[HoldingResources]  WITH CHECK ADD  CONSTRAINT [FK_HoldingResources_Resources] FOREIGN KEY([ResourceID])
REFERENCES [dbo].[Resources] ([ResourceID])
GO
ALTER TABLE [dbo].[HoldingResources] CHECK CONSTRAINT [FK_HoldingResources_Resources]
GO
ALTER TABLE [dbo].[Holdings]  WITH CHECK ADD  CONSTRAINT [FK_Holdings_Alliance] FOREIGN KEY([AllianceID])
REFERENCES [dbo].[Alliances] ([AllianceID])
GO
ALTER TABLE [dbo].[Holdings] CHECK CONSTRAINT [FK_Holdings_Alliance]
GO
ALTER TABLE [dbo].[Holdings]  WITH CHECK ADD  CONSTRAINT [FK_Holdings_House] FOREIGN KEY([HouseID])
REFERENCES [dbo].[Houses] ([HouseID])
GO
ALTER TABLE [dbo].[Holdings] CHECK CONSTRAINT [FK_Holdings_House]
GO
ALTER TABLE [dbo].[Holdings]  WITH CHECK ADD  CONSTRAINT [FK_Holdings_Map] FOREIGN KEY([MapID])
REFERENCES [dbo].[Maps] ([MapID])
GO
ALTER TABLE [dbo].[Holdings] CHECK CONSTRAINT [FK_Holdings_Map]
GO
ALTER TABLE [dbo].[Holdings]  WITH CHECK ADD  CONSTRAINT [FK_Holdings_Resources_Primary] FOREIGN KEY([PrimaryResourceID])
REFERENCES [dbo].[Resources] ([ResourceID])
GO
ALTER TABLE [dbo].[Holdings] CHECK CONSTRAINT [FK_Holdings_Resources_Primary]
GO
ALTER TABLE [dbo].[Holdings]  WITH CHECK ADD  CONSTRAINT [FK_Holdings_Resources_Secondary] FOREIGN KEY([SecondaryResourceID])
REFERENCES [dbo].[Resources] ([ResourceID])
GO
ALTER TABLE [dbo].[Holdings] CHECK CONSTRAINT [FK_Holdings_Resources_Secondary]
GO
ALTER TABLE [dbo].[Houses]  WITH CHECK ADD  CONSTRAINT [FK_Houses_Alliance] FOREIGN KEY([AllianceID])
REFERENCES [dbo].[Alliances] ([AllianceID])
GO
ALTER TABLE [dbo].[Houses] CHECK CONSTRAINT [FK_Houses_Alliance]
GO
ALTER TABLE [dbo].[Houses]  WITH CHECK ADD  CONSTRAINT [FK_Houses_Regions] FOREIGN KEY([Region])
REFERENCES [dbo].[Regions] ([RegionID])
GO
ALTER TABLE [dbo].[Houses] CHECK CONSTRAINT [FK_Houses_Regions]
GO
ALTER TABLE [dbo].[Letters]  WITH CHECK ADD  CONSTRAINT [FK_Letters_AuthorChar] FOREIGN KEY([AuthorCharId])
REFERENCES [dbo].[Characters] ([CharacterID])
GO
ALTER TABLE [dbo].[Letters] CHECK CONSTRAINT [FK_Letters_AuthorChar]
GO
ALTER TABLE [dbo].[Letters]  WITH CHECK ADD  CONSTRAINT [FK_Letters_OwnerChar] FOREIGN KEY([CurrentOwnerCharId])
REFERENCES [dbo].[Characters] ([CharacterID])
GO
ALTER TABLE [dbo].[Letters] CHECK CONSTRAINT [FK_Letters_OwnerChar]
GO
ALTER TABLE [dbo].[LetterTransfers]  WITH CHECK ADD  CONSTRAINT [FK_Transfers_FromChar] FOREIGN KEY([FromCharId])
REFERENCES [dbo].[Characters] ([CharacterID])
GO
ALTER TABLE [dbo].[LetterTransfers] CHECK CONSTRAINT [FK_Transfers_FromChar]
GO
ALTER TABLE [dbo].[LetterTransfers]  WITH CHECK ADD  CONSTRAINT [FK_Transfers_Letter] FOREIGN KEY([LetterId])
REFERENCES [dbo].[Letters] ([LetterId])
GO
ALTER TABLE [dbo].[LetterTransfers] CHECK CONSTRAINT [FK_Transfers_Letter]
GO
ALTER TABLE [dbo].[LetterTransfers]  WITH CHECK ADD  CONSTRAINT [FK_Transfers_ToChar] FOREIGN KEY([ToCharId])
REFERENCES [dbo].[Characters] ([CharacterID])
GO
ALTER TABLE [dbo].[LetterTransfers] CHECK CONSTRAINT [FK_Transfers_ToChar]
GO
ALTER TABLE [dbo].[Map_Cells]  WITH CHECK ADD  CONSTRAINT [FK_MapCells_Alliance] FOREIGN KEY([AllianceID])
REFERENCES [dbo].[Alliances] ([AllianceID])
GO
ALTER TABLE [dbo].[Map_Cells] CHECK CONSTRAINT [FK_MapCells_Alliance]
GO
ALTER TABLE [dbo].[Map_Cells]  WITH CHECK ADD  CONSTRAINT [FK_MapCells_House] FOREIGN KEY([HouseID])
REFERENCES [dbo].[Houses] ([HouseID])
GO
ALTER TABLE [dbo].[Map_Cells] CHECK CONSTRAINT [FK_MapCells_House]
GO
ALTER TABLE [dbo].[Map_Cells]  WITH CHECK ADD  CONSTRAINT [FK_MapCells_Maps] FOREIGN KEY([MapID])
REFERENCES [dbo].[Maps] ([MapID])
GO
ALTER TABLE [dbo].[Map_Cells] CHECK CONSTRAINT [FK_MapCells_Maps]
GO
ALTER TABLE [dbo].[Map_Cells]  WITH CHECK ADD  CONSTRAINT [FK_MapCells_Region] FOREIGN KEY([RegionID])
REFERENCES [dbo].[Regions] ([RegionID])
GO
ALTER TABLE [dbo].[Map_Cells] CHECK CONSTRAINT [FK_MapCells_Region]
GO
ALTER TABLE [dbo].[Map_Cells]  WITH CHECK ADD  CONSTRAINT [FK_MapCells_Terrain] FOREIGN KEY([TerrainID])
REFERENCES [dbo].[TerrainTypes] ([TerrainID])
GO
ALTER TABLE [dbo].[Map_Cells] CHECK CONSTRAINT [FK_MapCells_Terrain]
GO
ALTER TABLE [dbo].[Parties]  WITH CHECK ADD  CONSTRAINT [FK_Parties_CommanderChar] FOREIGN KEY([PartyCommanderCharacterID])
REFERENCES [dbo].[Characters] ([CharacterID])
GO
ALTER TABLE [dbo].[Parties] CHECK CONSTRAINT [FK_Parties_CommanderChar]
GO
ALTER TABLE [dbo].[Skills]  WITH CHECK ADD  CONSTRAINT [FK_Skill_Attribute] FOREIGN KEY([CoreAttributeID])
REFERENCES [dbo].[CoreAttributes] ([CoreAttributeID])
GO
ALTER TABLE [dbo].[Skills] CHECK CONSTRAINT [FK_Skill_Attribute]
GO
ALTER TABLE [dbo].[UnitWaypoints]  WITH CHECK ADD  CONSTRAINT [FK_UnitWaypoints_Units] FOREIGN KEY([UnitID])
REFERENCES [dbo].[Units] ([UnitID])
GO
ALTER TABLE [dbo].[UnitWaypoints] CHECK CONSTRAINT [FK_UnitWaypoints_Units]
GO
ALTER TABLE [dbo].[CharacterAttributes]  WITH CHECK ADD CHECK  (([Value]>=(1) AND [Value]<=(8)))
GO
ALTER TABLE [dbo].[CharacterAttributes]  WITH CHECK ADD CHECK  (([Value]>=(1) AND [Value]<=(8)))
GO
ALTER TABLE [dbo].[CharacterFavor]  WITH CHECK ADD CHECK  (([FavorPoints]>=(0)))
GO
ALTER TABLE [dbo].[CharacterLanguages]  WITH CHECK ADD CHECK  (([ProficiencyLevel]>=(1) AND [ProficiencyLevel]<=(3)))
GO
ALTER TABLE [dbo].[Characters]  WITH CHECK ADD  CONSTRAINT [CK_Characters_History_Len] CHECK  ((len([History])<=(10000)))
GO
ALTER TABLE [dbo].[Characters] CHECK CONSTRAINT [CK_Characters_History_Len]
GO
ALTER TABLE [dbo].[CharacterSkills]  WITH CHECK ADD  CONSTRAINT [CK_CharacterSkills_Value_0_5] CHECK  (([Value]>=(0) AND [Value]<=(5)))
GO
ALTER TABLE [dbo].[CharacterSkills] CHECK CONSTRAINT [CK_CharacterSkills_Value_0_5]
GO
ALTER TABLE [dbo].[CharacterWounds]  WITH CHECK ADD CHECK  (([Wounds]>=(0)))
GO
ALTER TABLE [dbo].[Holdings]  WITH CHECK ADD  CONSTRAINT [CK_Holdings_DefenseTier] CHECK  (([DefenseTier]>=(1) AND [DefenseTier]<=(5)))
GO
ALTER TABLE [dbo].[Holdings] CHECK CONSTRAINT [CK_Holdings_DefenseTier]
GO
ALTER TABLE [dbo].[Holdings]  WITH CHECK ADD  CONSTRAINT [CK_Holdings_PrimarySecondaryDifferent] CHECK  (([PrimaryResourceID] IS NULL OR [SecondaryResourceID] IS NULL OR [PrimaryResourceID]<>[SecondaryResourceID]))
GO
ALTER TABLE [dbo].[Holdings] CHECK CONSTRAINT [CK_Holdings_PrimarySecondaryDifferent]
GO
ALTER TABLE [dbo].[Holdings]  WITH CHECK ADD  CONSTRAINT [CK_Holdings_SettlementTier] CHECK  (([SettlementTier]>=(1) AND [SettlementTier]<=(5)))
GO
ALTER TABLE [dbo].[Holdings] CHECK CONSTRAINT [CK_Holdings_SettlementTier]
GO
ALTER TABLE [dbo].[TerrainTypes]  WITH CHECK ADD  CONSTRAINT [CK_TerrainTypes_ColorHex] CHECK  (([Color] like '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'))
GO
ALTER TABLE [dbo].[TerrainTypes] CHECK CONSTRAINT [CK_TerrainTypes_ColorHex]
GO
USE [master]
GO
ALTER DATABASE [SoSR_DB] SET  READ_WRITE 
GO
